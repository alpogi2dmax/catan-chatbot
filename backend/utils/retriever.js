import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';

const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT
const sbApiKey = process.env.SUPABASE_API_KEY
const openAIApiKey = process.env.OPENAI_API_KEY
const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'

const embeddings = new OpenAIEmbeddings({ 
    openAIApiKey,
    model: embeddingModel
 })

const client = createClient(sbUrl, sbApiKey)

const vectoreStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: 'documents',
    queryName: 'match_documents'
})

const retriever = vectoreStore.asRetriever()

export { retriever }