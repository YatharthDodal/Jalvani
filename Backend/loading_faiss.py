from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
import os



# Make sure to use the same embeddings model you used to create the index
embeddings = HuggingFaceEmbeddings(model_name="intfloat/e5-large-v2")

db = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)



os.environ["GOOGLE_API_KEY"] = "AIzaSyCAqLUT-PskLGVXMyw4i9mAzI6wvYd7YDA"

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

# 7️⃣ Build RetrievalQA chain
qa = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=db.as_retriever(search_kwargs={"k": 8}),
    chain_type="stuff"
)

# 8️⃣ Query example
query = "ground water level in amravati of 2024 and can u suggest some crop which can be grown in this area"
answer = qa.run(query)
print("🔹 Answer:", answer)