import express from 'express'
import cors from 'cors'
import { engine } from 'express-handlebars'
import multer from 'multer'
import { v4 } from 'uuid' 
import sqlite from 'sqlite3'

const server = express()
const upload = multer({ 
    storage: multer.diskStorage({
        filename(req, file, callback) {
            callback(null, file.originalname)
        },
        destination(req, file, callback) {
            callback(null, './files')
        },
    })
})

const db = new sqlite.Database("./database.db")

server.use(cors())
server.use(express.json())
server.use(express.urlencoded({ extended: true }))
server.use('/', express.static('./public'))

server.engine('.hbs', engine({ extname: ".hbs" }))
server.set('view engine', '.hbs')
server.set('views', './pages')

server.get('/', (request, response) => {
    response.render('index')
})

server.post('/upload', upload.single('file'), async (request, response) => {
    const { desc } = request.body
    const filename = request.file?.originalname
    const link = v4()

    if (!filename) {
        return response.send('File not selected')
    }

    const sql = 'INSERT INTO file(desc, filename, link) VALUES(?, ?, ?)'

    db.run(sql, [desc, filename, link], () => {
        response.render('share', {
            host: 'localhost',
            port: '8080',
            filename,
            link,
            desc
        })
    })
    // await prisma.file.create({
    //     data: {
    //         desc,
    //         filename,
    //         link
    //     }
    // })

   
})

server.get('/file/:link', async (request, response) => {
    const link = request.params.link

    db.get('SELECT * FROM file WHERE link = ?', [link], (error, file) => {
        if (!file) {
            return response.send('File not found')
        }
    
        response.render('download', {
            filename: file.filename,
            link: file.link,
            desc: file.desc
        })
    })
})

server.get('/download/:filename', async (request, response) => {
    response.sendFile(request.params.filename, { root: './files' })
})


server.get('/all', async (request, response) => {

    db.all('SELECT * FROM file', (error, files) => {
        response.render('all', {
            files,
            host: 'localhost',
            port: '8080',
        })
    })
})

server.listen(8080, () => console.log("Server is running on port 8080"))