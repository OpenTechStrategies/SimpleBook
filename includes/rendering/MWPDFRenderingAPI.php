

<?php

/**
 * API for PediaPress' mw-serve
 */
class MWPDFRenderingAPI extends CollectionRenderingAPI {
	protected function makeRequest( $command, array $params ) {
        $params['command'] = $command;
        $serveURL = "http://localhost:3333/";

		if ( !$serveURL ) {
			wfDebugLog( 'collection', 'The mwlib/OCG render server URL isn\'t configured.' );

			return new CollectionAPIResult( null );
		}

		$response = Http::post(
			$serveURL,
			[ 'postData' => $params ],
			__METHOD__
		);

		if ( $response === false ) {
			wfDebugLog( 'collection', "Request to $serveURL resulted in error" );
		}

		return new CollectionAPIResult( $response );
	}
}
