import * as express from "express"
import * as bodyParser from "body-parser"

const app = express()

app.set("port", 3000)

app.use(bodyParser.json())

app.get("/", (req: any, res: any) => res.send("hi"))

export = app
