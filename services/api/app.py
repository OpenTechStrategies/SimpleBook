import json
import subprocess
from flask import Flask, request, send_file
from rq import Queue, get_current_job
from rq.job import Job
from worker import conn
import logging
import sys

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


app = Flask(__name__)
q = Queue(connection=conn)


def print_to_pdf(urls, passthrough_parameters, username, password):
    job = get_current_job()
    params = [
        "node",
        "mw2pdf/built/main.js",
        "pdf",
        "--out",
        f"./{job.id}.pdf",
    ]
    if username and password:
        params.extend([
            "--mwUsername",
            username,
            "--mwPassword",
            password,
        ])
    if passthrough_parameters:
        params.extend([
            "--passthroughParameters",
            passthrough_parameters,
        ])
    params.extend(urls)
    subprocess.call(params)
    return


def render_book(book_data, passthrough_parameters, username, password):
    urls = list(map(lambda i: i["url"], book_data["items"]))
    job = q.enqueue_call(
        func=print_to_pdf,
        args=( urls, passthrough_parameters, username, password ),
        result_ttl=10000,
    )
    return {"collection_id": job.get_id(), "is_cached": False}


def render_status():
    job = Job.fetch(request.form["collection_id"], connection=conn)
    status = job.get_status()
    resp = {"state": status, "response": {"status": {"progress": 0}}}
    if status == "finished":
        resp["url"] = f"http://localhost:3333/{request.form['collection_id']}/"
    return resp


@app.route("/", methods=["POST"])
def process_command():
    if request.form["command"] == "render":
        return render_book(
            json.loads(request.form['metabook']),
            request.form['passthrough_parameters'],
            request.form['login_credentials[username]'],
            request.form['login_credentials[password]'],
        )
    elif request.form["command"] == "render_status":
        return render_status()


@app.route("/<collection_id>/", methods=["POST", "GET"])
def download(collection_id):
    return send_file(
        f"./{collection_id}.pdf", attachment_filename=f"{collection_id}.pdf"
    )
