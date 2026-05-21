import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { UploadForm } from "./upload-form"
import { UploadHistory } from "./upload-history"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="relative text-center space-y-1">
          <Link
            href="/dashboard"
            className="absolute left-0 top-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} /> 돌아가기
          </Link>
          <div className="text-4xl">🍇</div>
          <h1 className="text-2xl font-bold text-foreground">거래 내역 업로드</h1>
          <p className="text-muted-foreground text-sm">
            국민은행·뱅크샐러드 엑셀 파일을 올려주세요
          </p>
        </div>
        <UploadForm />
        <UploadHistory />
      </div>
    </div>
  )
}
