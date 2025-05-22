export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold text-primary mb-6">
          DocuChat AI
        </h1>
        <p className="text-xl mb-8">
          A conversational search platform for enterprise documents
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Upload Documents</h2>
            <p className="text-muted-foreground">
              Upload your documents or connect to Google Drive to get started.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Ask Questions</h2>
            <p className="text-muted-foreground">
              Chat with your documents and get accurate answers with citations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
