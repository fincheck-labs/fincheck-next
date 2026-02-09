import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectMongo } from "./mongodb";

const db = await connectMongo();

export const auth = betterAuth({
  socialProviders: {
    github:{
      clientId:process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }
  },
  database: mongodbAdapter(db),

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    nextCookies(), 
  ],
});
