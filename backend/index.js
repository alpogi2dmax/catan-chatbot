import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'

import { retriever } from './utils/retriever.js'
import { combineDocuments } from './utils/combineDocuments.js'

const app = express()

app.use(cors())
app.use(express.json())

const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT
const sbApiKey = process.env.SUPABASE_API_KEY
const openAIApiKey = process.env.OPENAI_API_KEY
const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'

const PORT = process.env.PORT || 5000

const llm = new ChatOpenAI({ openAIApiKey })

const standaloneQuestionTemplate = `
Given a conversation history (if any) and a question, convert it to a standalone question.
conversation history: {conv_history}
question: {question}
standalone question:
`
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)
const standaloneQuestionChain = standaloneQuestionPrompt
    .pipe(llm)
    .pipe(new StringOutputParser());

const answerTemplate = `
You are a helpful assistant for the board game Catan. Use the following context to answer the question.
If the answer is not found in the context, say "I'm sorry, I don't know the answer to that."
conversation history: {conv_history}
context: {context}
question: {question}
answer:
`
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)
const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser())

const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.standalone_question,
    retriever,
    combineDocuments
])

const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough()
    },
    {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question,
        conv_history: ({ original_input }) => original_input.conv_history
    },
    answerChain
])

// const result = await chain.invoke({ 
//     question: 'What is more fun, monopoly or catan?', 
//     conv_history: '' 
// })

// console.log(result)

app.post('/chat', async (req, res) => {
    const { question, conv_history } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' })
    
    try {
        const response = await chain.invoke({ question, conv_history })
        res.json({ answer: response })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to generate answer' })
    }
})

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`)
})