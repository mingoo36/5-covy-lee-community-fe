const postsPerPage = 3;
const maxPagesToShow = 5; // 한 번에 보여줄 최대 페이지 수
let currentPage = 1;
let posts = []; // 게시글 데이터를 저장할 변수
let totalPages = 0; // 총 페이지 수
let filteredPosts = []; // 필터된 게시글을 저장할 변수

// 세션 체크 함수
const checkSession = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/check-session', {
            method: 'GET',
            credentials: 'include' // 쿠키를 포함하여 서버에 세션 정보 전달
        });

        const data = await response.json();

        if (response.ok) {
            // 로그인된 상태에서, 사용자 정보를 세션 스토리지에 저장
            sessionStorage.setItem('user', JSON.stringify({
                user_id: data.user.id, // user_id를 포함시킴
                email: data.user.email,
                username: data.user.username,
                image: data.user.image
            }));
            console.log('로그인 상태:', data.user);
        } else {
            // 로그인되지 않은 경우, 로그인 페이지로 리디렉션
            window.location.href = './login.html';
        }
    } catch (error) {
        console.error('세션 체크 오류:', error.message);
        //window.location.href = './login.html'; // 에러 발생 시 로그인 페이지로 리디렉션
    }
};


// 페이지가 로드될 때 세션 체크
window.onload = checkSession;


// 게시글을 가져오는 함수
const fetchPosts = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/posts', {
            method: 'GET',
            credentials: 'include' // 쿠키 포함 설정
        });

        if (response.status === 401) {
            throw new Error('로그인이 필요합니다.');
        }

        if (!response.ok) {
            throw new Error('네트워크 응답이 좋지 않습니다.');
        }

        const fetchedPosts = await response.json(); // 게시물 데이터 가져오기
        filteredPosts = fetchedPosts.map(post => ({
            ...post,
            views: post.views || 0 // 조회수 기본값 설정
        })); // 필터된 게시물에 조회수를 포함
        totalPages = Math.ceil(filteredPosts.length / postsPerPage); // 총 페이지 수 계산
        displayPosts(); // 게시물 표시

    } catch (error) {
        console.error('게시글 가져오기 오류:', error.message);
        alert(error.message);
    }
};


// 게시글을 화면에 표시하는 함수
const displayPosts = () => {
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = '';

    if (filteredPosts.length === 0) {
        console.log('게시글이 없습니다.');
        cardContainer.innerHTML = '<p>게시글이 없습니다.</p>'; // 게시글이 없을 때 표시
        return;
    }

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToDisplay = filteredPosts.slice(startIndex, endIndex);

    postsToDisplay.forEach(post => {
        const profileImageUrl = post.author_image
            ? `http://localhost:3000/profile_images/${post.author_image}`
            : 'http://localhost:3000/profile_images/default-profile.jpg'; // 기본 이미지 경로

        const card = document.createElement('div');
        card.classList.add('card');

        // 카드 전체를 클릭하면 상세 페이지로 이동
        card.onclick = () => showDetails(post.id);

        // 작성일자 및 시간 포맷팅 (24시간 표기법)
        const createdAt = new Date(post.created_at);
        const formattedDate = `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

        card.innerHTML = `
            <h3>${post.title}</h3>
            <div class="stats-row">
                <div class="stats">
                    <span>❤️&nbsp;${post.like_count || 0}</span>
                    <span>💬&nbsp;${post.comment_count || 0}</span>
                    <span>👁️&nbsp;${post.views || 0}</span>
                </div>
                <p class="date">${formattedDate}</p>
            </div>
            <div class="horizontal-rule"></div>
            <div class="post-info">
                <div class="author-info">
                    <img class="author-profile" src="${profileImageUrl}" alt="작성자 이미지">
                    <p class="author">${post.author}</p>
                </div>
            </div>
        `;
        cardContainer.appendChild(card);
    });

    updatePagination();
};












// 페이지네이션 업데이트 함수
const updatePagination = () => {
    document.getElementById('prevButton').classList.toggle('disabled', currentPage === 1);
    document.getElementById('nextButton').classList.toggle('disabled', currentPage === totalPages);

    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';

    const startPage = Math.floor((currentPage - 1) / maxPagesToShow) * maxPagesToShow + 1;
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.onclick = () => goToPage(i);
        if (i === currentPage) {
            button.style.backgroundColor = '#666488'; // 현재 페이지 강조
            button.style.color = 'white';
        } else {
            button.style.backgroundColor = '#ccc'; // 나머지 페이지 버튼 색상
            button.style.color = 'black'; // 나머지 페이지 글자색
        }
        pageNumbers.appendChild(button);
    }
};

// 페이지 이동 함수
const goToPage = (pageNumber) => {
    currentPage = pageNumber;
    displayPosts();
};

// 이전 페이지 함수
const previousPage = () => {
    if (currentPage > 1) {
        currentPage--;
        displayPosts();
    }
};

// 다음 페이지 함수
const nextPage = () => {
    if (currentPage < totalPages) {
        currentPage++;
        displayPosts();
    }
};

// 게시글 상세 페이지로 이동하는 함수
const showDetails = (postId) => {
    const url = `detail.html?id=${postId}`;
    window.location.href = url; // 상세 페이지로 이동
};

// 게시글 검색 함수
const searchPosts = () => {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    // 제목 또는 작성자 이름에 검색어가 포함된 게시글 필터링
    filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchInput) ||
        post.author.toLowerCase().includes(searchInput)
    );

    // 현재 페이지와 총 페이지 수 업데이트
    currentPage = 1;
    totalPages = Math.ceil(filteredPosts.length / postsPerPage);

    // 필터링된 게시글 표시
    displayPosts();
};

// 페이지 클릭 시 드롭다운 숨기는 함수
window.onclick = (event) => {
    if (!event.target.matches('.profile-button') && !event.target.matches('#profileImage')) {
        const dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};

// 페이지 로드 시 게시글 가져오기
fetchPosts();


