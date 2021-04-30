

<?php

/**
 * API for PediaPress' mw-serve
 */
class MWPDFRenderingAPI extends CollectionRenderingAPI {
	protected function makeRequest( $command, array $params ) {
		global $wgSimpleBookPassthroughParameters,
			$wgSimpleBookRenderingApiUrl,
			$wgSimpleBookRenderingCredentials;

		$params['command'] = $command;

		if ( !$wgSimpleBookRenderingApiUrl ) {
			wfDebugLog( 'collection', 'The SimpleBook rendering API URL isn\'t configured.' );
			return new CollectionAPIResult( null );
		}

		if ( $wgSimpleBookRenderingCredentials ) {
			$params['login_credentials'] = $wgSimpleBookRenderingCredentials;
		}

		if ( $wgSimpleBookPassthroughParameters ) {
			$params['passthrough_parameters'] = json_encode($wgSimpleBookPassthroughParameters);
		}

		$response = Http::post(
			$wgSimpleBookRenderingApiUrl,
			[ 'postData' => $params ],
			__METHOD__
		);

		if ( $response === false ) {
			wfDebugLog( 'collection', "Request to $wgSimpleBookRenderingApiUrl resulted in error" );
		}

		return new CollectionAPIResult( $response );
	}
}
