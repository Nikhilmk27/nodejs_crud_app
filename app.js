// IMPORTS
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require ('express-session')

const app = express()
const PORT = process.env.PORT || 4000

// database connection
mongoose.connect(process.env.DB_URI)
const db = mongoose.connection
db.on('error',(error) => {console.log(error)})
db.once('open',() => console.log("conected to mongodb database"))

// middleweares
app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.use(session({
    secret:'my scret key',
    saveUninitialized:true,
    resave:false,
   
}))

// This middleware snippet effectively transfers the value stored in 
// req.session.message to res.locals.message for the current request, allowing it to be accessed 
// within views or other middleware/routes during the current request-response cycle. Additionally, it removes
//  the message from the session after it's been used, preventing it from persisting across multiple requests.
//   This pattern is often used for flash messages or temporary data in web applications.
app.use((req,res,next) => {
    res.locals.message = req.session.message
    delete req.session.message
    next()
})
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.static('uploads'))
// route prefix
app.use('',require('./routes/routes'))


app.listen(PORT,(req,res) => {
    console.log(`server start at http://localhost:${PORT}`)
})