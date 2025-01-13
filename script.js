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

    const addButtons = document.querySelectorAll('.task__add');
const modal = document.getElementById('taskModal');
const closeButton = document.querySelector('.close');

// Mostrar o modal ao clicar no botão
addButtons.forEach(button => {
    button.addEventListener('click', function() {
      const buttonRect = button.getBoundingClientRect(); // Pega a posição do botão
      const modalContent = modal.querySelector('.modal-content');
  
      // Posiciona o modal sobre o botão com um pequeno espaçamento
      modal.style.display = 'block';
      modal.style.left = `${buttonRect.left}px`; // Ajusta a posição horizontal
      modal.style.top = `${buttonRect.top + buttonRect.height + 5}px`; // Ajusta a posição vertical (com margem de 5px)
  
      // Esconde o botão clicado
      button.style.display = 'none';
    });
  });
  

// Fechar o modal
closeButton.addEventListener('click', function() {
  modal.style.display = 'none';
  addButtons.forEach(button => button.style.display = 'block'); // Exibe novamente todos os botões
});

// Fechar o modal ao clicar fora da janela modal
window.addEventListener('click', function(event) {
  if (event.target === modal) {
    modal.style.display = 'none';
    addButtons.forEach(button => button.style.display = 'block');
  }
});


    // Atualizar ao carregar a página
    updateProgressBars();
  });