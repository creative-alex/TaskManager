document.addEventListener('DOMContentLoaded', () => {
  // Declaração das variáveis no topo
  const taskElements = document.querySelectorAll('.task');
  const columns = document.querySelectorAll('.project-column');
  const buttonsAdicionar = document.querySelectorAll('.task__add');
  const janelaModal = document.getElementById('taskModal');
  const botaoFechar = document.querySelector('.close');
  const taskForm = document.getElementById('taskForm');
  const activityLog = document.getElementById('activity-log');
  const customContextMenu = document.getElementById('custom-context-menu');
  
  let draggedTask = null;
  let selectedTask = null;

  // Função para iniciar o arraste
  function handleDragStart(e) {
    draggedTask = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);

    // Ocultar a tarefa durante o arraste
    setTimeout(() => {
      this.style.display = 'none';
    }, 0);
  }

  // Função para finalizar o arraste
  function handleDragEnd() {
    this.style.display = 'block';
    draggedTask = null;

    // Remover classe de hover
    taskElements.forEach((item) => {
      item.classList.remove('task-hover');
    });
  }

  // Função para permitir o arraste sobre a coluna
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  // Função para soltar a tarefa na coluna
  function handleDrop(e) {
    e.preventDefault();

    if (draggedTask) {
        const column = this.closest('.project-column');
        const addTaskButton = column.querySelector('.task__add');
        column.insertBefore(draggedTask, addTaskButton);

        // Atualizar barras de progresso e eventos
        updateProgressBars();
        addDragAndDropEvents(column.querySelectorAll('.task'));

        // Log de atividades usando o título da tarefa
        const newColumn = column.querySelector('.project-column-heading__title').textContent.trim();
        logActivity(draggedTask, newColumn);

        draggedTask = null;
    }
  }

  // Função para registrar a atividade no log
  function logActivity(taskElement, actionOrColumn) {
    const logItem = document.createElement('li');

    // Acessar o título da tarefa (h2.task__title)
    const taskTitle = taskElement.querySelector('.task__title').textContent.trim();

    if (actionOrColumn === 'created') {
        logItem.textContent = `Task "${taskTitle}" was created.`;
    } else if (actionOrColumn === 'deleted') {
        logItem.textContent = `Task "${taskTitle}" was deleted.`;
    } else if (actionOrColumn === 'edited') {
        logItem.textContent = `Task "${taskTitle}" was edited.`;
    } else {
        logItem.textContent = `Task "${taskTitle}" moved to "${actionOrColumn}".`;
    }

    activityLog.prepend(logItem);
    
    // Limitar o log a 5 entradas
    const logItems = activityLog.querySelectorAll('li');
    if (logItems.length > 5) {
        activityLog.removeChild(logItems[logItems.length - 1]);
    }
  }

  // Função para atualizar as barras de progresso
  function updateProgressBars() {
    const progressMapping = {
      'New Tasks': {
        column: document.querySelector('.project-column:nth-child(1)'),
        progressBar: document.querySelector('.progress--new-tasks'),
        progressText: document.getElementById('new-tasks-progress')
      },
      'In Progress': {
        column: document.querySelector('.project-column:nth-child(2)'),
        progressBar: document.querySelector('.progress--in-progress'),
        progressText: document.getElementById('in-progress-progress')
      },
      'Needs Review': {
        column: document.querySelector('.project-column:nth-child(3)'),
        progressBar: document.querySelector('.progress--needs-review'),
        progressText: document.getElementById('needs-review-progress')
      },
      'Done': {
        column: document.querySelector('.project-column:nth-child(4)'),
        progressBar: document.querySelector('.progress--done'),
        progressText: document.getElementById('done-progress')
      }
    };

    const totalTasks = Object.values(progressMapping).reduce((total, { column }) => {
      return total + column.querySelectorAll('.task').length;
    }, 0);

    Object.keys(progressMapping).forEach((key) => {
      const { column, progressBar, progressText } = progressMapping[key];
      if (column && progressBar && progressText) {
        const tasks = column.querySelectorAll('.task');
        const taskCount = tasks.length;
        progressBar.max = totalTasks > 0 ? totalTasks : 1;
        progressBar.value = taskCount;
        progressText.textContent = `${progressBar.value}/${progressBar.max}`;
      }
    });
  }

  // Função para adicionar os eventos de drag and drop às tarefas
  function addDragAndDropEvents(tasks) {
    tasks.forEach((task) => {
      task.addEventListener('dragstart', handleDragStart, false);
      task.addEventListener('dragenter', () => task.classList.add('task-hover'), false);
      task.addEventListener('dragover', handleDragOver, false);
      task.addEventListener('dragleave', () => task.classList.remove('task-hover'), false);
      task.addEventListener('drop', handleDrop, false);
      task.addEventListener('dragend', handleDragEnd, false);
    });
  }

  // Função para adicionar a nova tarefa ao sistema
  function addNewTask(taskTitle, taskName, taskCategory) {
    const categoryTextMap = {
        'task__tag--coisas': 'Coisa das Cenas',
        'task__tag--cenas': 'Coisas Coisantes',
        'task__tag--ceninhas': 'Ceninhas',
    };

    const tagText = categoryTextMap[taskCategory] || 'Categoria Desconhecida';

    const newTask = document.createElement('div');
    newTask.className = 'task';
    newTask.setAttribute('draggable', 'true');
    newTask.innerHTML = ` 
        <button class='task__delete'>x</button>
        <div class='task__tags'>
            <span class='task__tag ${taskCategory}'>${tagText}</span>
            <button class='task__options'><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <h2 class='task__title'>${taskTitle}</h2>
        <p>${taskName}</p>
        <div class='task__stats'>
            <span><time datetime="${new Date().toISOString()}"><i class="fas fa-flag"></i>${new Date().toLocaleDateString()}</time></span>
        </div>
    `;

    const firstColumn = document.querySelector('.project-column');
    const addTaskButton = firstColumn.querySelector('.task__add');
    firstColumn.insertBefore(newTask, addTaskButton);

    // Configurar o botão de exclusão
    const deleteButton = newTask.querySelector('.task__delete');
    deleteButton.addEventListener('click', function () {
        newTask.remove();
        logActivity(newTask, 'deleted'); // Registro ao excluir a tarefa
        updateProgressBars();
    });

    // Adicionar eventos de arrastar e soltar
    addDragAndDropEvents([newTask]);

    // Atualizar as barras de progresso
    updateProgressBars();

    // Registro ao criar a tarefa
    logActivity(newTask, 'created');
  }

  // Eventos para adicionar tarefas
  buttonsAdicionar.forEach(botao => {
    botao.addEventListener('click', function () {
      botao.style.display = 'none';
      botao.insertAdjacentElement('afterend', janelaModal);
      janelaModal.style.display = 'block';
    });
  });

  botaoFechar.addEventListener('click', function () {
    janelaModal.style.display = 'none';
    buttonsAdicionar.forEach(botao => botao.style.display = 'block');
  });

  taskForm.addEventListener('submit', function (event) {
    event.preventDefault();

    // Obter valores do formulário
    const taskTitle = document.getElementById('taskTitle').value;
    const taskName = document.getElementById('taskName').value;
    const taskCategory = document.getElementById('taskCategory').value;

    // Adicionar nova tarefa
    addNewTask(taskTitle, taskName, taskCategory);

    // Resetar formulário e fechar modal
    taskForm.reset();
    janelaModal.style.display = 'none';
    buttonsAdicionar.forEach(button => button.style.display = 'block');
  });

  // Função para adicionar o evento de exclusão às tarefas
  function addDeleteEvent(task) {
    const deleteButton = task.querySelector('.task__delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', function () {
        task.remove();
        logActivity(task, 'deleted'); // Registro ao excluir a tarefa
        updateProgressBars();
      });
    }
  }

  // Adicionar evento de exclusão a todas as tarefas existentes
  taskElements.forEach(task => {
    addDeleteEvent(task);
  });

  // Adicionar eventos de drag and drop às tarefas e colunas
  addDragAndDropEvents(taskElements);

  columns.forEach((column) => {
    column.addEventListener('dragover', handleDragOver, false);
    column.addEventListener('drop', handleDrop, false);
  });  
});