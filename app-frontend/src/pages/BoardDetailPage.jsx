import { useParams } from 'react-router-dom';
import KanbanBoard from '../components/KanbanBoard';

function BoardDetailPage() {
  const { boardId } = useParams();
  
  return (
    <div className="board-detail-page">
      <KanbanBoard boardId={boardId} />
    </div>
  );
}

export default BoardDetailPage;