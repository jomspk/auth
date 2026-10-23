export function basicAuth(authHeader: string) {
    const [scheme, credentials] = authHeader.split(" ");
    if(scheme != "Basic") {
        throw new Error("Invalid authentication scheme");
    }
    if(!credentials) {
        throw new Error("Missing credentials");
    }
    const decodedCredentials = Buffer.from(credentials, "base64");
    const [clientId, clientSecret] = decodedCredentials.toString("utf-8").split(":");
    if(!clientId || !clientSecret) {
        throw new Error("Invalid credentials");
    }
    return {clientId, clientSecret};
}