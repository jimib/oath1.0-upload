OAuth1.0 Upload Example
=======================

This is a demonstration of uploading files using OAuth and Python's Rauth Module.

**Please Note:** This is an example using:

1. Dummy consumers and tokens
2. Files are authenticated using a custom checksum method. 

File Authentication
-------------------

This approach is different to the method outlined in the official OAuth documentation. 
We're using this method to demonstrate how the validation process can be extended.

For each file attached to the upload request, a checksum is created and passed as an additional parameter.

	#rough demonstration - see py/upload.py for exact demonstration
	#dict of files
	files = {}
	#file is passed as parameter 'image'
	file = open('image.png', 'rb')
	files["image"] = file
	#add checksum to oauth_parameters
	oauth_parameters["checksum_files:image"] = checksum(file)

OAuth Validation
----------------
On the Nodejs server we are using passport-http-oauth to validate the requests. There is no token generation phase, for this demonstration it is assumed the client already has credentials for consumer and token.

### see app/auth/index.js ###

A TokenStrategy is created to authenticate requests.

The first method supplies a consumer for the given consumer_key. If no matching consumer found false is returned instead.
The second method supplies a token for the given token_key. If no matching token found false is returned instead.
The third method checks the nonce and timestamp. This is optional but in this case we limit the age of timestamp, and ensure nonce is unique.

### see py/upload.py ###

This is an example of uploading an image using Rauth. You can experiment with generating bad requests by toggling the flags:

useValidCredentials: If False invalid consumer and token are used.
useValidCheckSum: If False an invalid checksum is generated for each file.
useRandomHash: If False the hash generated is not random, this causes server to reject second request as nonce is not unique.
useValidTimeStamp: If False then the timestamp is corrupted (set to 0).


