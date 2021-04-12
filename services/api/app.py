import json
import subprocess
from flask import Flask, request, send_file
from rq import Queue, get_current_job
from rq.job import Job
from worker import conn


app = Flask(__name__)
q = Queue(connection=conn)


def print_to_pdf(urls, title, subtitle):
	job = get_current_job()
	subprocess.call(["sh", "mw2pdf/get-cookies.sh"])
	subprocess.call(
		[
			"node",
			"mw2pdf/index.js",
			"pdf",
			"--cookie-jar",
			"cookies.jar",
			"--out",
			f"./{job.id}.pdf",
			"--title",
			title,
			"--subtitle",
			subtitle,
			*urls,
		]
	)
	return


def render_book():
	book = json.loads(request.form["metabook"])
	urls = list(map(lambda i: i["url"], book["items"]))
	job = q.enqueue_call(
		func=print_to_pdf,
		args=(urls, book["title"], book["subtitle"]),
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
		return render_book()
	elif request.form["command"] == "render_status":
		return render_status()


@app.route("/<collection_id>/", methods=["POST", "GET"])
def download(collection_id):
	return send_file(
		f"./{collection_id}.pdf", attachment_filename=f"{collection_id}.pdf"
	)
