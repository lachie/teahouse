import OAuth2Server, { Client, Falsey, RefreshToken } from "oauth2-server"

type Token = {
    accessToken: string,
    clientId: string,
    accessTokenExpiresOn: number,
    userId: string
}
export class Model {
    readonly tokens: Record<string, Token> = {}
    readonly clients: Record<string, Client> = {}
    constructor(readonly dbPath: string) {}

  getAccessToken(bearerToken: string): Token | Falsey {
    return this.tokens[bearerToken]
  },

  getClient(clientId:string , clientSecret: string): Client | Falsey {
    const client = this.clients[clientId]
    if(client && client.clientSecret === clientSecret) return client
  },

  getRefreshToken(bearerToken: string): RefreshToken | Falsey {
    return this.tokens[bearerToken]
  },

  /**
   * Get user.
   */

  getUser(username, password) {
    return db.hgetall(fmt(formats.user, username)).then(function (user) {
      if (!user || password !== user.password) {
        return
      }

      return {
        id: username,
      }
    })
  },

  saveToken(token, client, user) {
    var data = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      clientId: client.id,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      userId: user.id,
    }

    return Promise.all([
      db.hmset(fmt(formats.token, token.accessToken), data),
      db.hmset(fmt(formats.token, token.refreshToken), data),
    ]).return(data)
  },
}
