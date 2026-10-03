# Project Architecture Rules

- Keep shop login credential verification inside a server-side Edge Function; never place credentials or client-side authentication decisions in browser code, because browser code is user-controlled.