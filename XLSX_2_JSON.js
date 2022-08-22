const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const multer = require('multer')
const fs = require("fs")
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/sample", { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("connect with mongodb")
}).catch((err) => {
    console.log(err)
})

var XLSX = require("xlsx");

XLSX.utils.sheet_to_json()

const fileExtension = require('file-extension');
const { json } = require('express')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json())

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'API/')
        /*create an folde name API because the raw file will save there and then it converts to json and then it will deleted automatcally because of below code */
       
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage }).single('file');

app.get('/', (req, res) => {
    res.sendFile("hello world");
});
const productSchema = new mongoose.Schema({
    Name: String,
    description: String,

}, { strict: false })

const Product = new mongoose.model("Product", productSchema)

app.post('/upload', upload, async (req, res) => {
    const product = await Product.create(req.body);

    let excel2json;
    console.log(req.file)
    const doc = XLSX.readFile(req.file.path);
    const json = XLSX.utils.sheet_to_json(doc.Sheets[doc.SheetNames[0]])
    await Product.insertMany(json)

    /*code for remove original file from uploaded space*/
    await unlinkAsync(req.file.path)
    res.send(json);
    
    /*code for writing json data in local storage*/
    console.log(req.json)
    fs.writeFile('./db.xlsx', JSON.stringify(json), (err) => {
    })

    console.log(req.json)
});

app.get('/getAll', async (req, res) => {
    try{
        const product = await Product.find();
        res.json(product)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

app.get('/getOne/:id', async (req, res) => {
    try{
        const product = await Product.findById(req.params.id);
        res.json(product)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

app.put('/update/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const options = { new: true };

        const result = await Product.findByIdAndUpdate(
            id, updatedData, options
        )

        res.send(result)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

app.delete('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findByIdAndDelete(id)
        res.send(`Document with ${product.name} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})


app.listen('3000', () => {
    console.log('Server running on port 3000');
});
