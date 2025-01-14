document.addEventListener('DOMContentLoaded', (event) => {
    var dragSrcEl = null;

    function handleDragStart(e) {
      dragSrcEl = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.outerHTML);
    }

    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault(); // Necessário para permitir o drop.
      }
      e.dataTransfer.dropEffect = 'move';
      return false;
    }

    function handleDragEnter(e) {
      this.classList.add('task-hover');
    }

    function handleDragLeave(e) {
      this.classList.remove('task-hover');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
          e.stopPropagation(); // Evita que o evento se propague.
        }
      
        if (dragSrcEl !== this) {
          const column = this.closest('.project-column');
          const button = column.querySelector('.task__add'); // Seleciona o botão de adicionar tarefa
          dragSrcEl.remove();
      
          // Insere a tarefa antes do botão "Add Task"
          column.insertBefore(dragSrcEl, button);
      
          addDragAndDropEvents(column.querySelectorAll('.task'));
          updateProgressBars();
        }
        return false;
      }
      

    function handleDragEnd(e) {
      const items = document.querySelectorAll('.task');
      items.forEach((item) => {
        item.classList.remove('task-hover');
      });
    }

    function updateProgressBars() {
      // Mapeamento entre colunas e barras de progresso
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

      // Total de tarefas em todas as colunas
      const totalTasks = Object.values(progressMapping).reduce((total, { column }) => {
        return total + column.querySelectorAll('.task').length;
      }, 0);

      // Atualizar cada barra de progresso
      Object.keys(progressMapping).forEach((key) => {
        const { column, progressBar, progressText } = progressMapping[key];
        if (column && progressBar && progressText) {
          const tasks = column.querySelectorAll('.task');
          const taskCount = tasks.length;
          progressBar.max = totalTasks > 0 ? totalTasks : 1; // Garantir que o máximo nunca seja 0
          progressBar.value = taskCount;
          progressText.textContent = `${progressBar.value}/${progressBar.max}`;
        }
      });
    }

    function addDragAndDropEvents(items) {
      items.forEach((item) => {
        item.addEventListener('dragstart', handleDragStart, false);
        item.addEventListener('dragenter', handleDragEnter, false);
        item.addEventListener('dragover', handleDragOver, false);
        item.addEventListener('dragleave', handleDragLeave, false);
        item.addEventListener('drop', handleDrop, false);
        item.addEventListener('dragend', handleDragEnd, false);
      });
    }

    // Adicionar eventos às tarefas existentes
    const items = document.querySelectorAll('.task');
    addDragAndDropEvents(items);

    // Adicionar eventos às colunas
    const columns = document.querySelectorAll('.project-column');
    columns.forEach((column) => {
      column.addEventListener('dragover', handleDragOver, false);
      column.addEventListener('drop', handleDrop, false);
    });

    // Seleciona todos os botões com a classe 'task__delete'
    const buttons = document.querySelectorAll('.task__delete');

    buttons.forEach(button => {
        // Adiciona o evento de clique a cada botão
        button.addEventListener('click', function () {
            // Remove o elemento pai (que envolve o botão)
            this.parentElement.remove();
            updateProgressBars()
        });
    });


// Selecionar os elementos do DOM
const buttonsAdicionar = document.querySelectorAll('.task__add');
const janelaModal = document.getElementById('taskModal');
const botaoFechar = document.querySelector('.close');

buttonsAdicionar.forEach(botao => {
    botao.addEventListener('click', function () {
        // Esconde o botão atual
        botao.style.display = 'none';

        // Insere a janela modal *imediatamente após* o botão
        botao.insertAdjacentElement('afterend', janelaModal);

        // Exibe a janela modal
        janelaModal.style.display = 'block';
    });
});

botaoFechar.addEventListener('click', function () {
  janelaModal.style.display = 'none';
  buttonsAdicionar.forEach(botao => botao.style.display = 'block');
});

const taskForm = document.getElementById('taskForm');
const taskModal = document.getElementById('taskModal');

// Mapeamento de valores para os textos das tags
const categoryTextMap = {
    'task__tag--coisas': 'Coisa das Cenas',
    'task__tag--cenas': 'Coisas Coisantes',
    'task__tag--ceninhas': 'Ceninhas'
};

taskForm.addEventListener('submit', function (event) {
  event.preventDefault(); // Evita o recarregamento da página

  const taskName = document.getElementById('taskName').value;
  const taskCategory = document.getElementById('taskCategory').value;
  const tagText = categoryTextMap[taskCategory]; // Obtém o texto correspondente ao valor selecionado

  // Cria o elemento da nova tarefa
  const newTask = document.createElement('div');
  newTask.className = `task`; // Classe padrão da task
  newTask.setAttribute('draggable', 'true');
  newTask.innerHTML = `
      <button class='task__delete'>x</button>
      <div class='task__tags'>
        <span class='task__tag ${taskCategory}'>${tagText}</span>
        <button class='task__options'><i class="fas fa-ellipsis-h"></i></button>
      </div>
      <p>${taskName}</p>
      <div class='task__stats'>
        <span><time datetime="${new Date().toISOString()}"><i class="fas fa-flag"></i>${new Date().toLocaleDateString()}</time></span>
      </div>
  `;

  // Insere a nova tarefa no primeiro div com a classe 'project-column'
  const firstColumn = document.querySelector('.project-column');
  const addTaskButton = firstColumn.querySelector('.task__add');
  firstColumn.insertBefore(newTask, addTaskButton); // Insere a nova tarefa antes do botão "Add Task"

  // Adiciona eventos de clique ao botão de excluir do novo card
  const deleteButton = newTask.querySelector('.task__delete');
  deleteButton.addEventListener('click', function () {
      newTask.remove();
      updateProgressBars(); // Atualiza as barras de progresso
  });

  // Adiciona eventos de arrastar e soltar à nova tarefa
  addDragAndDropEvents([newTask]);

  // Atualiza as barras de progresso
  updateProgressBars();

  // Limpa o formulário e fecha o modal
  taskForm.reset();
  taskModal.style.display = 'none';
  document.querySelectorAll('.task__add').forEach(button => button.style.display = 'block');
});

  });