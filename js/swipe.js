// wwwroot/js/swipe.js
(function () {
    let openSwipeElement = null;
    const threshold = 40;      // порог открытия (пиксели)
    const actionWidth = 50;    // ширина кнопки удаления

    function closeSwipe(element) {
        if (!element) return;
        const content = element.querySelector('.swipe-content');
        if (content) content.style.transform = '';
        element.dataset.open = 'false';
        if (openSwipeElement === element) openSwipeElement = null;
    }

    function initSwipe(element) {
        let startX = 0;
        let isSwiping = false;
        const content = element.querySelector('.swipe-content');

        // ----- Touch события -----
        const onTouchStart = (e) => {
            if (openSwipeElement && openSwipeElement !== element) {
                closeSwipe(openSwipeElement);
            }
            startX = e.touches[0].clientX;
            isSwiping = true;
            element.classList.add('swiping');
        };

        const onTouchMove = (e) => {
            if (!isSwiping) return;
            e.preventDefault(); // запрещаем прокрутку страницы
            const currentX = e.touches[0].clientX;
            const delta = currentX - startX; // >0 при движении вправо
            if (delta > 0) {
                const translate = Math.min(delta, actionWidth); // сдвиг вправо
                content.style.transform = `translateX(${translate}px)`;
            }
        };

        const onTouchEnd = (e) => {
            if (!isSwiping) return;
            isSwiping = false;
            element.classList.remove('swiping');
            const delta = e.changedTouches[0].clientX - startX;
            if (delta > threshold) {
                openSwipeElement = element;
                content.style.transform = `translateX(${actionWidth}px)`;
                element.dataset.open = 'true';
            } else {
                closeSwipe(element);
            }
        };

        // ----- Mouse события -----
        const onMouseDown = (e) => {
            if (openSwipeElement && openSwipeElement !== element) {
                closeSwipe(openSwipeElement);
            }
            startX = e.clientX;
            isSwiping = true;
            element.classList.add('swiping');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isSwiping) return;
            const currentX = e.clientX;
            const delta = currentX - startX;
            if (delta > 0) {
                const translate = Math.min(delta, actionWidth);
                content.style.transform = `translateX(${translate}px)`;
            }
        };

        const onMouseUp = (e) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (!isSwiping) return;
            isSwiping = false;
            element.classList.remove('swiping');
            const delta = e.clientX - startX;
            if (delta > threshold) {
                openSwipeElement = element;
                content.style.transform = `translateX(${actionWidth}px)`;
                element.dataset.open = 'true';
            } else {
                closeSwipe(element);
            }
        };

        // Навешиваем обработчики
        element.addEventListener('touchstart', onTouchStart, { passive: false });
        element.addEventListener('touchmove', onTouchMove, { passive: false });
        element.addEventListener('touchend', onTouchEnd);
        element.addEventListener('mousedown', onMouseDown);

        // Для возможности закрыть извне
        element.closeSwipe = () => closeSwipe(element);
    }

    // Глобальная регистрация .NET helper
    window.dotNetHelper = null;
    window.registerDeleteItem = function (helper) {
        window.dotNetHelper = helper;
        window.deleteItem = function (id) {
            if (window.dotNetHelper) {
                window.dotNetHelper.invokeMethodAsync('DeleteItem', id);
            }
        };
    };

    window.closeAllSwipes = function () {
        if (openSwipeElement) {
            closeSwipe(openSwipeElement);
        }
    };

    // Инициализация всех существующих .swipe-item
    function initAllSwipes() {
        document.querySelectorAll('.swipe-item').forEach(el => {
            if (!el.hasAttribute('data-swipe-initialized')) {
                initSwipe(el);
                el.setAttribute('data-swipe-initialized', 'true');
            }
        });
    }

    // Следим за появлением новых элементов (например, после добавления)
    const observer = new MutationObserver(initAllSwipes);
    observer.observe(document.body, { childList: true, subtree: true });

    // Закрытие при клике вне открытого свайпа
    document.addEventListener('click', function (e) {
        if (openSwipeElement && !openSwipeElement.contains(e.target)) {
            closeSwipe(openSwipeElement);
        }
    });

    // Обработка клика по кнопке удаления
    document.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.delete-button');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const itemElement = deleteBtn.closest('.swipe-item');
            if (itemElement) {
                const itemId = itemElement.dataset.id;
                if (itemId && window.deleteItem) {
                    window.deleteItem(parseInt(itemId));
                }
                closeSwipe(itemElement);
            }
        }
    });

    // Запускаем при загрузке
    initAllSwipes();
})();