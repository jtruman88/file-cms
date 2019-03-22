document.addEventListener('DOMContentLoaded', function() {
  const app = (function() {
    return {
      init: function() {
        page.bindEvents();
      }
    };
  })();
  
  const store = (function() {
    return {
      
    };
  })();
  
  const page = (function() {
    const main = document.querySelector('main');
    const section = document.querySelector('section#file_view');
    const overlay = document.getElementById('overlay');
    const confirmMessage = document.querySelector('#message h3');
    
    const templates = (function() {
      let result = {};
      let temps = document.querySelectorAll('[type="text/x-handlebars"]');
      
      Array.prototype.slice.call(temps).forEach(temp => {
        result[temp.id] = Handlebars.compile(temp.innerHTML);
        temp.remove();
      });
      
      return result;
    })();
    
    function handleClick(e) {
      e.preventDefault();
      
      let element = e.target;
      let type = element.getAttribute('data-type');
      
      switch (type) {
        case 'view':
          setActive(element);
          xhr.getFile(element.getAttribute('href'), handleViewFile);
          break;
        case 'edit':
          handleEditFile();
          break;
        case 'close':
          removeAllActive();
          resetFile();
          break;
        case 'new':
          removeAllActive();
          handleNewFile();
          break;
        case 'create':
          createNewFile();
          break;
        case 'delete':
          removeAllActive();
          confirmDeleteFile(element);
          break;
      }
    }
    
    function setActive(element) {
      removeAllActive();
      element.classList.add('active');
    }
    
    function removeAllActive() {
      let actives = document.querySelectorAll('.active');
      Array.prototype.slice.call(actives).forEach(elem => {
        elem.classList.remove('active');
      });
    }
    
    function confirmDeleteFile(element) {
      store.confirm = { type: 'delete', action: deleteFile };
      updateConfirmMessage('Deleting this document cannot be undone. Do you want to continue?');
      displayConfirm();
    }
    
    function deleteFile() {
      resetFile();
      xhr.deleteFile(updatePage);
      // display message
    }
    
    function createNewFile() {
      let filename = document.querySelector('input[type="text"]').value;
      
      if (isValidFilename(filename)) {
        let body = document.querySelector('textarea').value;
        let data = { filename: filename, body: body };
        xhr.createFile(data, updatePage);
      } else {
        // display invalid message on screen
        console.log('Invalid filename');
        return;
      }
    }
    
    function isValidFilename(name) {
      return name.match(/\w+\.(txt|md)/) && doesNotExist(name);
    }
    
    function doesNotExist(name) {
      let filenames = document.querySelectorAll('nav li a');
      
      for (let i = 0; i < filenames.length; i += 1) {
        let filename = filenames[i].innerText;
        if (name === filename) {
          return false;
        }
      }
      
      return true;
    }
    
    function updatePage() {
      let container = document.querySelector('div');
      
      if (container && container.id !== 'overlay') {
        container.remove();
      }
      
      xhr.getAllFiles(updateFileList);
    }
    
    function updateFileList(response) {
      let nav = document.querySelector('nav');
      let tempWrapper = document.createElement('div');
      tempWrapper.innerHTML = response;
      nav.innerHTML = tempWrapper.firstElementChild.innerHTML;
      //display file created message
    }
    
    function handleNewFile() {
      resetFile();
      let container = document.createElement('div');
      container.innerHTML = templates.new();
      main.appendChild(container);
    }
    
    function handleEditFile() {
      resetFile();
      updateFileHead(true);
      section.classList.remove('hidden');
      let container = document.createElement('section');
      container.innerHTML = templates.edit(store.current);
      section.appendChild(container);
      main.addEventListener('click', handleExitEdit, true);
    }
    
    function handleExitEdit(e) {
      e.preventDefault();
      e.stopPropagation();
      
      let element = e.target;
      let type = element.getAttribute('data-type');
      
      if (type === 'edit') {
        return;
      } else if (type === 'delete') {
        confirmDeleteFile(element);
      } else if (element.tagName === 'A') {
        confirmExitEdit(element);
      } else if (type === 'save') {
        saveEdits();
      }
    }
    
    function saveEdits() {
      main.removeEventListener('click', handleExitEdit, true);
      let body = document.querySelector('textarea').value;
      store.current.body = body;
      xhr.editFile(handleViewFile);
      // display message
    }
    
    function confirmExitEdit(element) {
      store.confirm = { type: 'edit', action: element };
      updateConfirmMessage('Any changes will be lost. Do you want to continue?');
      displayConfirm();
    }
    
    function handleConfirm(e) {
      e.preventDefault();
      let element = e.target;
      
      if (element.id === 'overlay') {
        hideConfirm();
        return;
      }
      
      if (element.tagName === 'BUTTON') {
        if (element.id === 'true') {
          
          switch (store.confirm.type) {
            case 'edit':
              main.removeEventListener('click', handleExitEdit, true);
              store.confirm.action.click();
              break;
            case 'delete':
              store.confirm.action();
              break;
          }
          
        }
        
        hideConfirm();
      }
    }
    
    function updateConfirmMessage(message) {
      confirmMessage.innerText = message;
    }
    
    function displayConfirm() {
      overlay.classList.remove('hidden');
    }
    
    function hideConfirm() {
      overlay.classList.add('hidden');
    }
    
    function resetFile() {
      if (section.children.length > 1) {
        section.children[1].remove();
        section.classList.add('hidden');
      }
      
      let container = document.querySelector('div');
      
      if (container && container.id !== 'overlay') {
        container.remove();
      }
    }
    
    function handleViewFile(data) {
      store.current = data;
      resetFile();
      updateFileHead();
      switch (data.type) {
        case 'txt':
          renderText(data);
          break;
        case 'md':
          renderMarkdown(data);
          break
      }
    }
    
    function renderMarkdown(data) {
      let article = document.createElement('article');
      let converter = new showdown.Converter();
      let md = data.body;
      
      article.innerHTML = converter.makeHtml(md);
      
      section.appendChild(article);
      section.classList.remove('hidden');
    }
    
    function renderText(data) {
      let textContainer = document.createElement('pre');
      
      textContainer.innerText = data.body;
      
      section.appendChild(textContainer);
      section.classList.remove('hidden');
    }
    
    function updateFileHead(editing = false) {
      let heading = section.firstElementChild.firstElementChild;
      
      if (editing) {
        heading.innerText = 'Editing "' + store.current.name + '"';
      } else {
        heading.innerText = 'Viewing "' + store.current.name + '"';
      }
    }
    
    return {
      bindEvents: function() {
        main.addEventListener('click', handleClick.bind(this));
        overlay.addEventListener('click', handleConfirm);
      }
    };
  })();
  
  const xhr = (function() {
    return {
      getFile: function(path, callback) {
        let request = new XMLHttpRequest();
        request.open('GET', path);
        request.responseType = 'json';
        request.send();
        
        request.addEventListener('load', function() {
          callback(request.response);
        });
      },
      
      editFile: function(callback) {
        let data = store.current;
        let request = new XMLHttpRequest();
        request.open('POST', '/' + data.name + '/edit');
        request.setRequestHeader('Content-Type', 'application/json');
        request.responseType = 'json';
        request.send(JSON.stringify(data));
        
        request.addEventListener('load', function() {
          callback(data);
        });
      },
      
      createFile: function(data, callback) {
        let request = new XMLHttpRequest();
        request.open('POST', '/create');
        request.send(JSON.stringify(data));
        
        request.addEventListener('load', function() {
          callback();
        });
      },
      
      getAllFiles: function(callback) {
        let request = new XMLHttpRequest();
        request.open('GET', '/files');
        request.send();
        
        request.addEventListener('load', function() {
          callback(request.response);
        });
      },
      
      deleteFile: function(callback) {
        let request = new XMLHttpRequest();
        request.open('POST', '/' + store.current.name + '/delete');
        request.send();
        
        request.addEventListener('load', function() {
          callback();
        });
      }
    };
  })();
  
  app.init();
});