import SEO from '@fsd/shared/ui/SEO.jsx'
import { QuizEmoji } from '@fsd/features/quiz'

export default function Quiz() {
  return (
    <div className="container page">
      <SEO title="Квиз" description="Квиз по аниме: угадай по эмодзи." canonical="https://quickik.ru/quiz" />
      <QuizEmoji />
    </div>
  )
}
