const BASE_URL = insomnia.globals.get("baseUrl")
const AUTH_TOKEN = insomnia.globals.get("accessToken")
const REFRESH_TOKEN = insomnia.globals.get("refreshToken")
const LOGIN = insomnia.globals.get("login")
const PASSWORD = insomnia.globals.get("password")


async function makeReq(req){
	return await new Promise((resolve, reject) => {
		insomnia.sendRequest(
			req,
			(err, resp) => {
				if (err != null) {
						reject(err);
				} else {
						resolve(resp);
				}
			}
		);
	});
}

function setAuthorization(token){
	insomnia.request.addHeader({
		"key": "Authorization", 
		"value": `Bearer ${token}`
	})
}

function setEnv(body){
	insomnia.globals.set("accessToken", body.accessToken)
	insomnia.globals.set("refreshToken", body.refreshToken)
	setAuthorization(body.accessToken)
	return
}

async function auth(){
	const authReq = {
		url: BASE_URL + '/api/auth/login',
		method: 'POST',
		header: {
			'Content-Type': 'application/json'
		},
		body: {
			mode: 'raw',
			raw: JSON.stringify({
				"email": LOGIN,
				"password": PASSWORD
			})
		},
	};
	
	const authRes = await makeReq(authReq);
	return setEnv(authRes.json())
}

async function validateToken(){
	const validateTokenReq = {
		url: BASE_URL +  "/api/auth/validate",
		method: "GET",
		header: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${AUTH_TOKEN}`
		},

	};
	
	const res = await makeReq(validateTokenReq)
	if(res.code == 401){
		await refreshToken()
	}
	setAuthorization(AUTH_TOKEN)
	return
}

async function refreshToken(){
	if(!REFRESH_TOKEN){
		await auth()
		return
	}

	const refreshTokenReq = {
		url: BASE_URL + '/api/auth/refresh',
		method: 'POST',
		header: {
			'Content-Type': 'application/json'
		},
		body: {
			mode: 'raw',
			raw: JSON.stringify({
				"refreshToken": REFRESH_TOKEN
			})
		},
	};
	const refreshRes = await makeReq(refreshTokenReq)
	
	if(refreshRes.code == 401){
		await auth()
		return 
	}
	return setEnv(refreshRes.json())
}

if(!AUTH_TOKEN){
	await auth()
	return
}
await validateToken()
