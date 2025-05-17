class CustomAlbum extends HTMLElement {
  static observedAttributes = ['src', 'title', 'type'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._photos = [];
    this._isExpanded = false;
  }

  // 当嵌入页面的时候触发
  connectedCallback() {
    this._loadPhotos();
    this._render();
  }

  // 当标签属性改变的时候触发
  attributeChangedCallback(name) {
    if (name ==='src') this._loadPhotos();
    this._render();
  }

  async _loadPhotos() {
    try {
      const folder = this.getAttribute('src'); // 获取src属性作为文件夹
      // 调用主进程的 getAlbumAllPhotos 方法获取图片文件
      const response = await parent.window.electronAPI.getAlbumAllPhotos(folder);
      if (response.code === 1) {
        const imagePaths = response.data;
        const files = await Promise.all(imagePaths.map(async path => {
          const file = await parent.window.electronAPI.getFileInfo(path);
          return {
            url: file.url,
            name: file.name,
            path: file.path,
            width: 0, // 可扩展获取实际尺寸
            height: 0
          };
        }));
        this._photos = files;
        this._render();
      } else {
        console.error('获取图片文件失败:', response.err);
      }
    } catch (error) {
      console.error('加载图片失败:', error);
    }
  }

  async _uploadFile(file) {
    try {
      const folder = this.getAttribute('src');
      const fileData = {
        name: file.name,
        data: await this._fileToUint8Array(file)
      };
      const username = window.sessionStorage.getItem('username')
      const albunName = this.getAttribute('title')

      const result = await parent.window.electronAPI.saveFile(fileData, folder);
      //同时向数据库中添加一条记录
      const res = await parent.window.electronAPI.insertPhotoToAlbum(username, albunName, fileData.name)
      if (result.code == 1 && res.code == 1) {
        await this._loadPhotos();
      } else {
        alert(`上传失败: ${result.error}`);
      }
    } catch (error) {
      alert(`上传错误: ${error.message}`);
    }
  }

  async _deletePhoto(filename) {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      const username = window.sessionStorage.getItem('username')
      const albumName = this.getAttribute('title');
      const result = await parent.window.electronAPI.deletePhoto({username, albumName, photoName: filename});
      console.log(result)
      if (result.code == 1) {
        await this._loadPhotos();
      } else {
        alert(`删除失败: ${result.error}`);
      }
    } catch (error) {
      alert(`删除错误: ${error.message}`);
    }
  }

// 辅助方法：将File对象转换为Uint8Array
async _fileToUint8Array(file) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
          const arrayBuffer = reader.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
  });
}

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 20px;
          border: 2px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          ${this._getBorderStyle()}
        }

       .header {
          padding: 15px;
          background: #f8f9fa;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

       .grid {
          display: ${this._isExpanded? 'grid' : 'none'};
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          padding: 20px;
        }

       .thumbnail {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          transition: transform 0.2s;
        }

       .thumbnail:hover {
          transform: translateY(-2px);
        }

       .thumbnail img {
          width: 100%;
          height: 200px;
          object-fit: contain;
          background: #f5f5f5;
        }

       .delete-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(255, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: none;
        }

       .thumbnail:hover .delete-btn {
          display: block;
        }

       .upload-area {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          border: 2px dashed #ccc;
          cursor: pointer;
        }
      </style>

      <div class="header">
        <h3>${this.getAttribute('title') || '未命名相册'}</h3>
        <span>${this._photos.length} 张照片</span>
      </div>

      <div class="grid">
        ${this._photos.map(photo => `
          <div class="thumbnail">
            <img src="${photo.path}" alt="${photo.name}">
            <button class="delete-btn" data-filename="${photo.name}">×</button>
          </div>
        `).join('')}
        
        <div class="upload-area">
          <span>点击上传照片</span>
        </div>
      </div>
    `;

    // 事件绑定
    this.shadowRoot.querySelector('.header').addEventListener('click', () => {
      this._isExpanded =!this._isExpanded;
      this._render();
    });

    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deletePhoto(btn.dataset.filename);
      });
    });

    this.shadowRoot.querySelector('.upload-area').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
          if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
          }
          this._uploadFile(file);
        });
      });
      input.click();
    });
  }

  _getBorderStyle() {
    const type = this.getAttribute('type') || 'default';
    const styles = {
      heart: 'clip-path: polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 50% 100%, 0% 70%, 0% 35%, 20% 10%);',
      star: 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);',
      circle: 'clip-path: circle(50% at 50% 50%);'
    };
    return styles[type] || '';
  }
}

export {
  CustomAlbum
};