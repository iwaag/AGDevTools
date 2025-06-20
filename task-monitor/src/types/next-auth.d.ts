import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name: string
  }
  
  interface Session {
    user: {
      id: string
      name: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
  }
}