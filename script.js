document.addEventListener('DOMContentLoaded', () => {
  // Declaração das variáveis no topo
  const taskElements = document.querySelectorAll('.task');
  const columns = document.querySelectorAll('.project-column');
  const buttonsAdicionar = document.querySelectorAll('.task__add');
  const janelaModal = document.getElementById('taskModal');
  const botaoFechar = document.querySelector('.close');
  const taskForm = document.getElementById('taskForm');
  const activityLog = document.getElementById('activity-log');  
  const contextMenu = document.getElementById('customContextMenu');
  const categorySearchSelect = document.getElementById('categorySearch');
  const tasks = document.querySelectorAll('.task');
  let draggedTask = null;
  let currentTask = null;
  let taskIdCounter = 13; // Inicia o contador para IDs das tarefas

 
   // Função para filtrar tarefas por categoria
   function filterTasksByCategory() {
     const selectedCategory = categorySearchSelect.value;
 
     tasks.forEach(task => {
       // Localizar todos os spans com a classe `task__tag` dentro de `.task__tags`
       const taskTags = task.querySelectorAll('.task__tags .task__tag');
       
       // Verificar se algum dos spans possui a classe correspondente
       const hasMatchingTag = Array.from(taskTags).some(tag => tag.classList.contains(selectedCategory));
 
       if (hasMatchingTag) {
         task.classList.remove('hidden'); // Mostra a tarefa se houver correspondência
       } else {
         task.classList.add('hidden'); // Esconde a tarefa se não houver correspondência
       }
     });
   }
 
   // Event listener para o dropdown de categorias
   categorySearchSelect.addEventListener('change', () => {
     console.log(`Dropdown value changed to: ${categorySearchSelect.value}`); // Log para depuração
     filterTasksByCategory();
   });

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
    if (logItems.length > 10) {
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

  updateProgressBars();

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
    newTask.setAttribute('data-task-id', taskIdCounter++); // Atribui o ID único e incrementa o contador
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

  // Menu de contexto
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const task = event.target.closest('.task');
    if (task) {
      currentTask = task;
      contextMenu.style.top = `${event.clientY}px`;
      contextMenu.style.left = `${event.clientX}px`;
      contextMenu.style.display = 'block';
    } else {
      contextMenu.style.display = 'none';
    }
  });

  document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
  });


  function restoreTaskView(task, title, name, category) {
    const categoryTextMap = {
        'task__tag--coisas': 'Coisa das Cenas',
        'task__tag--cenas': 'Coisas Coisantes',
        'task__tag--ceninhas': 'Ceninhas',
    };

    task.innerHTML = `
        <button class='task__delete'>x</button>
        <div class='task__tags'>
            <span class='task__tag ${category}'>${categoryTextMap[category]}</span>
            <button class='task__options'><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <h2 class='task__title'>${title}</h2>
        <p>${name}</p>
        <div class='task__stats'>
            <span><time datetime="${new Date().toISOString()}"><i class="fas fa-flag"></i>${new Date().toLocaleDateString()}</time></span>
        </div>
    `;

    // Reaplicar eventos à tarefa restaurada
    addDragAndDropEvents([task]);
}



  contextMenu.addEventListener('click', (event) => {
    event.preventDefault();
    const action = event.target.dataset.action;
    if (!action) return;

    switch (action) {
      case 'edit':
        if (currentTask) {
          const taskTitle = currentTask.querySelector('.task__title').textContent.trim();
          const taskName = currentTask.querySelector('p').textContent.trim();
          const taskCategory = currentTask.querySelector('.task__tag').classList[1];
        
          // Criar o formulário de edição
          const editForm = document.createElement('form');
          editForm.innerHTML = `
            <input type="text" name="editTitle" id="edit-title" value="${taskTitle}" placeholder="Task Title" required />
            <input type="text" name="editName" id="edit-name" value="${taskName}" placeholder="Task Description" required />
            <select name="editCategory" id="edit-category" required>
              <option value="task__tag--coisas" ${taskCategory === 'task__tag--coisas' ? 'selected' : ''}>Coisa das Cenas</option>
              <option value="task__tag--cenas" ${taskCategory === 'task__tag--cenas' ? 'selected' : ''}>Coisas Coisantes</option>
              <option value="task__tag--ceninhas" ${taskCategory === 'task__tag--ceninhas' ? 'selected' : ''}>Ceninhas</option>
            </select>
            <button type="submit" class="save-edit">Save</button>
            <button type="button" class="cancel-edit">Cancel</button>
          `;
        
          // Substituir o conteúdo da tarefa pelo formulário
          currentTask.innerHTML = '';
          currentTask.appendChild(editForm);
        
          // Cancelar edição
          const cancelButton = editForm.querySelector('.cancel-edit');
          cancelButton.addEventListener('click', () => {
            restoreTaskView(currentTask, taskTitle, taskName, taskCategory);
          });
        
          // Salvar edição
          const saveButton = editForm.querySelector('.save-edit');
          saveButton.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o envio padrão do formulário
        
            // Obter valores do formulário
            const newTitle = editForm.querySelector('#edit-title').value.trim();
            const newName = editForm.querySelector('#edit-name').value.trim();
            const newCategory = editForm.querySelector('#edit-category').value;

            const categoryTextMap = {
              'task__tag--coisas': 'Coisa das Cenas',
              'task__tag--cenas': 'Coisas Coisantes',
              'task__tag--ceninhas': 'Ceninhas',
          };
        
            // Atualiza a tarefa
            currentTask.innerHTML = `
              <button class='task__delete'>x</button>
              <div class='task__tags'>
                <span class='task__tag ${newCategory}'>${categoryTextMap[newCategory]}</span>
                <button class='task__options'><i class="fas fa-ellipsis-h"></i></button>
              </div>
              <h2 class='task__title'>${newTitle}</h2>
              <p>${newName}</p>
              <div class='task__stats'>
                <span><time datetime="${new Date().toISOString()}"><i class="fas fa-flag"></i>${new Date().toLocaleDateString()}</time></span>
              </div>
            `;
        
            // Registrar a edição no log
            logActivity(currentTask, 'edited');
        
            // Reaplicar eventos
            addDragAndDropEvents([currentTask]);
        
            // Limpar referência
            currentTask = null;
          });
        }    
      case 'delete':
        if (currentTask) {
          const taskTitle = currentTask.querySelector('.task__title').textContent;
          currentTask.remove();
        }
        break;
    
      case 'move':
        if (currentTask && event.target.dataset.targetColumn) {
          const targetColumnSelector = event.target.dataset.targetColumn;
          const targetColumn = document.querySelector(targetColumnSelector);
    
          if (targetColumn) {
            const addTaskButton = targetColumn.querySelector('.task__add');
            targetColumn.insertBefore(currentTask, addTaskButton);
    
            // Atualizar progresso e registrar a ação
            updateProgressBars();
            const newColumn = targetColumn.querySelector('.project-column-heading__title').textContent.trim();
            logActivity(currentTask, newColumn);
          }
        }
        break;
    
      default:
        console.log('Ação desconhecida:', action);
    }
    contextMenu.style.display = 'none';
  });

  // Adicionar evento de exclusão a todas as tarefas existentes
  taskElements.forEach(task => {
    const deleteButton = task.querySelector('.task__delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', function () {
        task.remove();
        logActivity(task, 'deleted'); // Registro ao excluir a tarefa
        updateProgressBars();
      });
    }
  });

  // Adicionar eventos de drag and drop às tarefas e colunas
  addDragAndDropEvents(taskElements);

  columns.forEach((column) => {
    column.addEventListener('dragover', handleDragOver, false);
    column.addEventListener('drop', handleDrop, false);
  });  



});
