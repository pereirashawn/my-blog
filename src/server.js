import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient }from 'mongodb'
import path from 'path'

const url = 'mongodb://localhost:27017/articles'
const app = express()
const PORT = 8000

app.use(bodyParser.json())

app.use(express.static(path.join(__dirname,'/build')))



const ConnectDB = async (operations,res) => {

    try{
        const client = await MongoClient.connect(url, { useUnifiedTopology: true })
        const db = client.db('my-blog')

        await operations(db)

        client.close()
    }
    catch(error) {
        res.status(500).json({message : `Error connecting to server : ${error}`})
    }

}
    

app.get('/api/article/:name', async (req,res) => {

        ConnectDB(async (db) => {
            const articleName = req.params.name
            const articleInfo = await db.collection('articles').findOne({name : articleName})
            res.status(200).json(articleInfo)
        },res)
        

})

app.post('/api/article/:name/upvote', async (req,res) => {
 

    ConnectDB(async(db) => {
        const articleName = req.params.name

        const articleInfo = await db.collection('articles').findOne({name : articleName})
        await db.collection('articles').updateOne({name: articleName}, {
            '$set' : {
                upvotes : articleInfo.upvotes + 1,
            }
        })
        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName})

        res.status(200).json(updatedArticleInfo)

    },res)
    
})

app.post('/api/article/:name/add-comment', (req,res) => {

    ConnectDB(async (db) => {
        const {username,text} = req.body
        const articleName = req.params.name

        const articleInfo = await db.collection('articles').findOne({name : articleName})
        await db.collection('articles').updateOne({name: articleName}, {
            '$set' : {
                comments : articleInfo.comments.concat({username,text}),
            }
        })
        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName})

        res.status(200).json(updatedArticleInfo)

    },res)
})

app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(PORT,() => console.log('-- Listening on port 8000 --'))