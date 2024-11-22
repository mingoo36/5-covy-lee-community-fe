const params = new URLSearchParams(window.location.search);
const postId = params.get('id'); // 게시글 ID

if (!postId) {
    console.error('게시글 ID가 없습니다.');
    alert('게시글 ID가 필요합니다.');
} else {
    // 게시글 정보 및 댓글 목록 가져오기
    increaseViewCount(); // 조회수 증가
    fetchPost();
    fetchComments();
}

// 조회수 증가
async function increaseViewCount() {
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}/views`, {
            method: 'PATCH',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('조회수 증가 요청 실패');
        }

        const { views } = await response.json();
        document.getElementById('postVisitor').innerText = views; // 조회수 반영
    } catch (error) {
        console.error('조회수 증가 중 오류 발생:', error.message);
    }
}


// 게시글 정보 가져오기
async function fetchPost() {
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
            method: 'GET',
            credentials: 'include', // 쿠키를 포함하여 요청을 보냄
        });

        if (!response.ok) {
            throw new Error('게시글을 불러오는 데 실패했습니다.');
        }

        const post = await response.json();

        // 게시글 정보 설정
        document.getElementById('postTitle').innerText = post.title || '제목 없음';
        document.getElementById('postContent').innerText = post.content || '내용 없음';
        document.getElementById('postUsername').innerText = post.author || '작성자 정보 없음';

        // 수정 버튼 링크 설정
        document.getElementById('editButton').href = `edit.html?id=${postId}`;

        // 이미지 설정 (이미지가 없으면 기본 이미지 사용)
        const imageUrl = post.image
            ? `http://localhost:3000/post_images/${post.image}`
            : `http://localhost:3000/post_images/default-image.jpg`;
        document.getElementById('postImage').src = imageUrl;

        // 좋아요, 댓글 수 설정
        document.getElementById('postLike').innerText = post.like || 0;
        document.getElementById('postComment').innerText = post.comment || 0;
    } catch (error) {
        console.error('게시글 가져오기 오류:', error.message);
        alert('게시글을 불러오는 데 문제가 발생했습니다.');
    }
}


// 댓글 목록 가져오기
async function fetchComments() {
    try {
        const response = await fetch(`http://localhost:3000/posts/${postId}/comments`, {
            method: 'GET',
            credentials: 'include', // 쿠키 포함
        });

        if (!response.ok) {
            throw new Error('댓글 목록을 불러오는 데 실패했습니다.');
        }

        const comments = await response.json();

        // 댓글 목록 화면에 추가
        comments.forEach(comment => addCommentToList(comment));

        // 댓글 수 업데이트
        updateCommentCount();
    } catch (error) {
        console.error('댓글 목록 가져오기 오류:', error.message);
        alert('댓글 목록을 불러오는 데 문제가 발생했습니다.');
    }
}

// 댓글 작성
const submitComment = async () => {
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();

    if (!commentText) {
        alert('댓글을 입력하세요.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // 쿠키 포함
            body: JSON.stringify({ content: commentText }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || '댓글 작성에 실패했습니다.');
            return;
        }

        // 서버에서 반환된 댓글 데이터
        const result = await response.json();

        // 작성된 댓글을 화면에 추가
        addCommentToList(result); // 서버 응답 데이터 그대로 사용

        // 댓글 수 업데이트
        updateCommentCount();
        window.location.reload();

        commentInput.value = ''; // 입력 필드 초기화
    } catch (error) {
        console.error('댓글 작성 요청 중 오류 발생:', error.message);
        alert('댓글 작성 중 오류가 발생했습니다.');
    }
};

// 댓글 리스트에 댓글 추가
function addCommentToList(comment) {
    const commentList = document.getElementById('commentList');

    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');
    commentDiv.style.display = "flex";
    commentDiv.style.justifyContent = "space-between";
    commentDiv.setAttribute('data-id', comment.comment_id);

    const commentInfoDiv = document.createElement('div');
    commentInfoDiv.classList.add('comment-info');

    const authorDiv = document.createElement('div');
    authorDiv.classList.add('comment-author');
    authorDiv.textContent = comment.author || '익명';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('comment-content');
    contentDiv.textContent = comment.content;

    const dateDiv = document.createElement('div');
    dateDiv.classList.add('comment-date');
    const createdAt = new Date(comment.created_at);
    dateDiv.textContent = !isNaN(createdAt) ? createdAt.toLocaleString() : '알 수 없는 날짜';

    commentInfoDiv.appendChild(authorDiv);
    commentInfoDiv.appendChild(contentDiv);
    commentInfoDiv.appendChild(dateDiv);

    const commentActionsDiv = document.createElement('div');
    commentActionsDiv.classList.add('comment-actions');

    const editButton = document.createElement('button');
    editButton.textContent = '수정';
    editButton.onclick = () => editComment(comment.comment_id);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '삭제';
    deleteButton.onclick = () => deleteComment(comment.comment_id);

    commentActionsDiv.appendChild(editButton);
    commentActionsDiv.appendChild(deleteButton);

    commentDiv.appendChild(commentInfoDiv);
    commentDiv.appendChild(commentActionsDiv);

    commentList.prepend(commentDiv);
}

// 댓글 수정
async function editComment(commentId) {
    const newContent = prompt('수정할 내용을 입력하세요:');
    if (!newContent) return;

    try {
        const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content: newContent }),
        });

        if (!response.ok) throw new Error('댓글 수정에 실패했습니다.');

        window.location.reload();
    } catch (error) {
        console.error(error.message);
    }
}

// 댓글 삭제
async function deleteComment(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) throw new Error('댓글 삭제에 실패했습니다.');

        const commentDiv = document.querySelector(`[data-id='${commentId}']`);
        if (commentDiv) commentDiv.remove();

        updateCommentCount();
        window.location.reload();
    } catch (error) {
        console.error(error.message);
    }
}

// 댓글 수 업데이트
function updateCommentCount() {
    const commentCount = document.getElementById('commentList').children.length;
    document.getElementById('postComment').innerText = commentCount;
}

// 게시글 삭제
async function deletePost() {
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}`, { method: 'DELETE' });

        if (!response.ok) throw new Error('게시글 삭제에 실패했습니다.');

        window.location.href = './community.html';
    } catch (error) {
        console.error(error.message);
    }
}

// 모달 열기/닫기
function showModal() { document.getElementById('deleteModal').style.display = 'block'; }
function closeModal() { document.getElementById('deleteModal').style.display = 'none'; }
function confirmDelete() { deletePost(); closeModal(); }
