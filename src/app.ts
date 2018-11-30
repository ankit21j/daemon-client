import * as express from "express"
import * as bodyParser from "body-parser"

const app = express()

app.set("port", 7000)

app.use(bodyParser.json())

export = app
