#!/usr/bin/python

from rauth import OAuth1Session
import requests, hashlib, time, random

useValidCredentials = False
useValidCheckSum = True
useRandomHash = True
useValidTimeStamp = True

if useValidCredentials:
	consumer = {"key" : "123","secret" : "456"}
	token = {"key" : "321","secret" : "654"}
else:
	consumer = {"key" : "badKey", "secret" : "badSecret"}
	token = {"key" : "badKey", "secret" : "badSecret"}

urlProtected = "http://localhost:4000/protected"
urlUpload = "http://localhost:4000/upload"

def hashFile(filepath):
	sha1 = hashlib.sha1()
	f = open(filepath, 'rb')
	try:
		sha1.update(f.read())
	finally:
		f.close()

	if useValidCheckSum:
		return sha1.hexdigest()
	else:
		return "badChecksum"
	
def hashRandom():
	if useRandomHash:
		sha1 = hashlib.sha1()
		sha1.update(str(random.random()));
		return sha1.hexdigest()
	else:
		return "static-hash"

def exampleGET():
	session = OAuth1Session(consumer["key"],
                        consumer["secret"],
                        access_token=token["key"],
                        access_token_secret=token["secret"])

	try:
		response = session.get(urlProtected,verify=True)
	except:
		print "Failed to connect to server, is it running"
		return
		
	if response.status_code == 200:
		print "Response: ", response.text
	else:
		print "Error: ", response.status_code, response.text

def exampleUpload():
	from rauth.oauth import (HmacSha1Signature, RsaSha1Signature,
	                         PlaintextSignature)
	
	fileImage = 'image.png'
	
	oauth_params = {
		"oauth_version": '1.0',
		"oauth_signature_method": 'HMAC-SHA1',
		"oauth_consumer_key": consumer["key"],
		"oauth_token": token["key"],
		"oauth_nonce": hashRandom(),
		"oauth_timestamp": int(time.time())
	}
	
	if useValidTimeStamp == False:
		oauth_params["oauth_timestamp"] = 0;
	
	#add additional query string params
	oauth_params["checksum_files:image"] = hashFile(fileImage)
	
	oauth_params["oauth_signature"] = HmacSha1Signature().sign(consumer["secret"],
	                               token["secret"],
	                               'POST',
	                               urlUpload,
	                               oauth_params,
								   {})
	
	try:
		response = requests.post(urlUpload, params=oauth_params, files={'image': open(fileImage, 'rb')})
	except:
		print "Failed to connect to server, is it running?"
		return
	
	if response.status_code == 200:
		print "Response: ", response.text
	else:
		print "Error: ", response.status_code, response.text
	
exampleUpload()