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
  let draggedTask = null;
  let dragPlaceholder = null;
  let currentTask = null;
  let taskIdCounter = 13; // Inicia o contador para IDs das tarefas
 
  // Função para iniciar o arraste
  function handleDragStart(e) {
    draggedTask = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);

    dragPlaceholder = document.createElement('div');
    dragPlaceholder.className = 'drag-placeholder';
    dragPlaceholder.style.height = this.offsetHeight + 'px';

    setTimeout(() => {
      this.style.opacity = '0.4';
      this.parentNode.insertBefore(dragPlaceholder, this.nextSibling);
    }, 0);
  }

  // Função para finalizar o arraste
  function handleDragEnd() {
    this.style.opacity = '';
    if (dragPlaceholder) {
      dragPlaceholder.remove();
      dragPlaceholder = null;
    }
    draggedTask = null;
  }

  // Função para permitir o arraste sobre a coluna
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  // Função para soltar a tarefa na coluna
  function handleDrop(e) {
    e.preventDefault();

    if (!draggedTask || !dragPlaceholder) return;

    dragPlaceholder.parentNode.insertBefore(draggedTask, dragPlaceholder);
    dragPlaceholder.remove();
    dragPlaceholder = null;

    const column = draggedTask.closest('.project-column');
    updateProgressBars();
    addDragAndDropEvents(column.querySelectorAll('.task'));
    const newColumn = column.querySelector('.project-column-heading__title').textContent.split(' · ')[0].trim();
    logActivity(draggedTask, newColumn);
    saveTasks();
    filterTasksByCategory(document.getElementById('projectCategorySearch').value);

    draggedTask = null;
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

        // Atualizar contador no cabeçalho
        const titleEl = column.querySelector('.project-column-heading__title');
        if (titleEl) titleEl.textContent = `${key} · ${taskCount}`;

        // Estado vazio
        const emptyEl = column.querySelector('.column-empty');
        if (taskCount === 0 && !emptyEl) {
          const empty = document.createElement('p');
          empty.className = 'column-empty';
          empty.textContent = 'Sem tarefas aqui';
          column.insertBefore(empty, column.querySelector('.task__add'));
        } else if (taskCount > 0 && emptyEl) {
          emptyEl.remove();
        }
      }
    });
  }

  // Guardar tarefas no localStorage
  function saveTasks() {
    const data = [];
    columns.forEach((column, columnIndex) => {
      column.querySelectorAll('.task').forEach(task => {
        const tagSpan = task.querySelector('.task__tag');
        const tagClass = tagSpan ? tagSpan.classList[1] : 'task__tag--coisas';
        const dateEl = task.querySelector('time');
        data.push({
          id: task.getAttribute('data-task-id'),
          title: task.querySelector('.task__title').textContent.trim(),
          description: task.querySelector('p').textContent.trim(),
          tagClass: tagClass,
          columnIndex: columnIndex,
          date: dateEl ? dateEl.getAttribute('datetime') : new Date().toISOString()
        });
      });
    });
    localStorage.setItem('taskmanager-tasks', JSON.stringify(data));
  }

  // Carregar tarefas do localStorage
  function loadTasks() {
    const saved = localStorage.getItem('taskmanager-tasks');
    if (!saved) {
      saveTasks();
      return;
    }

    const tasks = JSON.parse(saved);

    columns.forEach(column => {
      column.querySelectorAll('.task').forEach(task => task.remove());
    });

    const textMap = {
      'task__tag--coisas': 'Coisas Coisantes',
      'task__tag--cenas': 'Coisa das Cenas',
      'task__tag--ceninhas': 'Ceninhas',
    };
    const classMap = {
      'task__tag--coisas': 'coisas',
      'task__tag--cenas': 'cenas',
      'task__tag--ceninhas': 'ceninhas',
    };

    tasks.forEach(taskData => {
      const column = columns[taskData.columnIndex];
      if (!column) return;

      const categoryClass = classMap[taskData.tagClass] || 'coisas';
      const tagText = textMap[taskData.tagClass] || 'Categoria';

      const taskEl = document.createElement('div');
      taskEl.className = `task ${categoryClass}`;
      taskEl.setAttribute('draggable', 'true');
      taskEl.setAttribute('data-task-id', taskData.id);
      taskEl.innerHTML = `
        <button class='task__delete'>x</button>
        <div class='task__tags'>
          <span class='task__tag ${taskData.tagClass}'>${tagText}</span>
          <button class='task__options'><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <h2 class='task__title'>${taskData.title}</h2>
        <p>${taskData.description}</p>
        <div class='task__stats'>
          <span><time datetime="${taskData.date}"><i class="fas fa-flag"></i>${new Date(taskData.date).toLocaleDateString()}</time></span>
        </div>
      `;

      const addTaskButton = column.querySelector('.task__add');
      column.insertBefore(taskEl, addTaskButton);

      taskEl.querySelector('.task__delete').addEventListener('click', function () {
        taskEl.remove();
        logActivity(taskEl, 'deleted');
        updateProgressBars();
        saveTasks();
      });

      addDragAndDropEvents([taskEl]);
    });

    if (tasks.length > 0) {
      const maxId = Math.max(...tasks.map(t => parseInt(t.id) || 0));
      if (maxId >= taskIdCounter) taskIdCounter = maxId + 1;
    }
  }

  loadTasks();
  updateProgressBars();

  // Função para adicionar os eventos de drag and drop às tarefas
  function addDragAndDropEvents(tasks) {
    tasks.forEach((task) => {
      task.addEventListener('dragstart', handleDragStart, false);
      task.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragPlaceholder || task === draggedTask) return;
        const rect = task.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
          task.parentNode.insertBefore(dragPlaceholder, task);
        } else {
          task.parentNode.insertBefore(dragPlaceholder, task.nextSibling);
        }
      }, false);
      task.addEventListener('drop', handleDrop, false);
      task.addEventListener('dragend', handleDragEnd, false);
    });
  }

  // Função para adicionar a nova tarefa ao sistema
  function addNewTask(taskTitle, taskName, taskCategory) {
    const categoryTextMap = {
        'task__tag--coisas': 'Coisas Coisantes',
        'task__tag--cenas': 'Coisa das Cenas',
        'task__tag--ceninhas': 'Ceninhas',
    };

    const categoryClassMap = {
        'task__tag--coisas': 'coisas',
        'task__tag--cenas': 'cenas',
        'task__tag--ceninhas': 'ceninhas',
    };

    const tagText = categoryTextMap[taskCategory] || 'Categoria Desconhecida';
    const categoryClass = categoryClassMap[taskCategory] || 'categoria-desconhecida';

    const newTask = document.createElement('div');
    newTask.className = `task ${categoryClass}`; // Adiciona a classe correspondente à categoria
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
        saveTasks();
    });

    // Adicionar eventos de arrastar e soltar
    addDragAndDropEvents([newTask]);

    // Atualizar as barras de progresso
    updateProgressBars();

    // Registro ao criar a tarefa
    logActivity(newTask, 'created');
    saveTasks();
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
        'task__tag--coisas': 'Coisas Coisantes',
        'task__tag--cenas': 'Coisa das Cenas',
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

    task.querySelector('.task__delete').addEventListener('click', function () {
        task.remove();
        logActivity(task, 'deleted');
        updateProgressBars();
        saveTasks();
    });

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
              <option value="task__tag--coisas" ${taskCategory === 'task__tag--coisas' ? 'selected' : ''}>Coisas Coisantes</option>
              <option value="task__tag--cenas" ${taskCategory === 'task__tag--cenas' ? 'selected' : ''}>Coisa das Cenas</option>
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
              'task__tag--coisas': 'Coisas Coisantes',
              'task__tag--cenas': 'Coisa das Cenas',
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

            const saved = currentTask;
            saved.querySelector('.task__delete').addEventListener('click', function () {
              saved.remove();
              logActivity(saved, 'deleted');
              updateProgressBars();
              saveTasks();
            });

            logActivity(currentTask, 'edited');
            addDragAndDropEvents([currentTask]);
            saveTasks();

            currentTask = null;
          });
        }
        break;
      case 'delete':
        if (currentTask) {
          currentTask.remove();
          saveTasks();
          updateProgressBars();
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
            const newColumn = targetColumn.querySelector('.project-column-heading__title').textContent.split(' · ')[0].trim();
            logActivity(currentTask, newColumn);
            saveTasks();
            filterTasksByCategory(document.getElementById('projectCategorySearch').value);
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
        saveTasks();
      });
    }
  });

  // Adicionar eventos de drag and drop às tarefas e colunas
  addDragAndDropEvents(taskElements);

  columns.forEach((column) => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!dragPlaceholder) return;
      const addTaskButton = column.querySelector('.task__add');
      column.insertBefore(dragPlaceholder, addTaskButton);
    }, false);
    column.addEventListener('drop', handleDrop, false);
  });  

// Função para filtrar as tasks com base na categoria selecionada
function filterTasksByCategory(selectedValue) {
    // Se "All Projects" estiver selecionado, mostra todas as divs
    if (selectedValue === "") {
        document.querySelectorAll(".coisas, .ceninhas, .cenas").forEach(category => {
            category.classList.remove("hidden");
        });
    } else if (selectedValue === "coisas") {
        document.querySelectorAll(".ceninhas, .cenas").forEach(category => {
            category.classList.add("hidden");
        });
        document.querySelectorAll(".coisas").forEach(category => {
            category.classList.remove("hidden");
        });
    } else if (selectedValue === "cenas") {
        document.querySelectorAll(".coisas, .ceninhas").forEach(category => {
            category.classList.add("hidden");
        });
        document.querySelectorAll(".cenas").forEach(category => {
            category.classList.remove("hidden");
        });
    } else if (selectedValue === "ceninhas") {
        document.querySelectorAll(".coisas, .cenas").forEach(category => {
            category.classList.add("hidden");
        });
        document.querySelectorAll(".ceninhas").forEach(category => {
            category.classList.remove("hidden");
        });
    }
}

document.getElementById("projectCategorySearch").addEventListener("change", function () {
    const selectedValue = document.getElementById("projectCategorySearch").value;
    filterTasksByCategory(selectedValue);
});




});