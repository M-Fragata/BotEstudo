import { app } from "./app.ts"
import { Env } from "./utils/Environment.ts"

app.listen(Env.PORT, () => {
  console.log(`🚀 Fragata Quiz API rodando em http://localhost:${Env.PORT}`)
})