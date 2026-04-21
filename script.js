class AveCarousel {
    constructor() {
        this.photos = [];
        this.currentIndex = 0;
        this.presets = [];
        this.currentSettings = {
            x: 0,
            y: 0,
            scale: 1,
            z: 1,
            borderColor: '#ffffff',
            borderWidth: 0,
            borderRadius: 0,
            description: ''
        };
        this.loadPresetsFromStorage();
        this.initEventListeners();
        this.loadPhotosFromStorage();
    }

    initEventListeners() {
        // Carga de fotos
        document.getElementById('photoInput').addEventListener('change', (e) => this.handlePhotoUpload(e));
        document.getElementById('loadFolderBtn').addEventListener('click', () => this.loadPhotosFromFolder());

        // Controles
        document.getElementById('xControl').addEventListener('input', (e) => this.updateSetting('x', parseInt(e.target.value)));
        document.getElementById('yControl').addEventListener('input', (e) => this.updateSetting('y', parseInt(e.target.value)));
        document.getElementById('scaleControl').addEventListener('input', (e) => this.updateSetting('scale', parseFloat(e.target.value)));
        document.getElementById('zControl').addEventListener('input', (e) => this.updateSetting('z', parseInt(e.target.value)));
        document.getElementById('borderColor').addEventListener('change', (e) => this.updateSetting('borderColor', e.target.value));
        document.getElementById('borderWidth').addEventListener('input', (e) => this.updateSetting('borderWidth', parseInt(e.target.value)));
        document.getElementById('borderRadius').addEventListener('input', (e) => this.updateSetting('borderRadius', parseInt(e.target.value)));
        document.getElementById('description').addEventListener('input', (e) => this.updateSetting('description', e.target.value));

        // Navegación
        document.getElementById('prevBtn').addEventListener('click', () => this.previousPhoto());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPhoto());

        // Presets
        document.getElementById('savePresetBtn').addEventListener('click', () => this.savePreset());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportConfig());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importInput').click());
        document.getElementById('importInput').addEventListener('change', (e) => this.importConfig(e));

        // Atajos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handlePhotoUpload(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.photos.push({
                    src: event.target.result,
                    name: file.name,
                    description: ''
                });
                this.savePhotosToStorage();
                this.renderPhotoList();
                if (this.photos.length === 1) {
                    this.currentIndex = 0;
                    this.updatePreview();
                }
            };
            reader.readAsDataURL(file);
        });
    }

    loadPhotosFromFolder() {
        alert('Para cargar una carpeta completa, usa el input de fotos y selecciona múltiples imágenes.\n\nNota: Los navegadores no permiten acceso directo a carpetas por seguridad.');
    }

    renderPhotoList() {
        const photoList = document.getElementById('photoList');
        photoList.innerHTML = '';
        
        this.photos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item' + (index === this.currentIndex ? ' active' : '');
            const img = document.createElement('img');
            img.src = photo.src;
            img.title = photo.name;
            photoItem.appendChild(img);
            photoItem.addEventListener('click', () => this.selectPhoto(index));
            photoList.appendChild(photoItem);
        });

        this.updatePhotoCounter();
    }

    selectPhoto(index) {
        // Guardar configuración de foto actual
        if (this.photos[this.currentIndex]) {
            this.photos[this.currentIndex].description = document.getElementById('description').value;
            this.savePhotosToStorage();
        }

        this.currentIndex = index;
        this.renderPhotoList();
        this.updatePreview();
        this.loadSettingsUI();
    }

    nextPhoto() {
        if (this.photos.length === 0) return;
        this.selectPhoto((this.currentIndex + 1) % this.photos.length);
    }

    previousPhoto() {
        if (this.photos.length === 0) return;
        this.selectPhoto((this.currentIndex - 1 + this.photos.length) % this.photos.length);
    }

    updateSetting(key, value) {
        this.currentSettings[key] = value;
        this.updateUIDisplay();
        this.updatePreview();
        this.savePhotosToStorage();
    }

    updateUIDisplay() {
        document.getElementById('xValue').textContent = this.currentSettings.x;
        document.getElementById('yValue').textContent = this.currentSettings.y;
        document.getElementById('scaleValue').textContent = this.currentSettings.scale.toFixed(1);
        document.getElementById('zValue').textContent = this.currentSettings.z;
        document.getElementById('borderWidthValue').textContent = this.currentSettings.borderWidth;
        document.getElementById('borderRadiusValue').textContent = this.currentSettings.borderRadius;
    }

    updatePreview() {
        const carouselPreview = document.getElementById('carouselPreview');
        const descriptionPreview = document.getElementById('descriptionPreview');

        if (this.photos.length === 0) {
            carouselPreview.innerHTML = '<p style="color: #666;">No hay fotos cargadas</p>';
            descriptionPreview.innerHTML = '';
            return;
        }

        const photo = this.photos[this.currentIndex];
        const img = document.createElement('img');
        img.src = photo.src;
        img.style.transform = `translate(${this.currentSettings.x}px, ${this.currentSettings.y}px) scale(${this.currentSettings.scale})`;
        img.style.zIndex = this.currentSettings.z;
        img.style.border = `${this.currentSettings.borderWidth}px solid ${this.currentSettings.borderColor}`;
        img.style.borderRadius = `${this.currentSettings.borderRadius}px`;

        carouselPreview.innerHTML = '';
        carouselPreview.appendChild(img);
        descriptionPreview.innerHTML = photo.description || '<span style="color: #555;">Sin descripción</span>';
    }

    loadSettingsUI() {
        const photo = this.photos[this.currentIndex];
        
        document.getElementById('xControl').value = this.currentSettings.x;
        document.getElementById('yControl').value = this.currentSettings.y;
        document.getElementById('scaleControl').value = this.currentSettings.scale;
        document.getElementById('zControl').value = this.currentSettings.z;
        document.getElementById('borderColor').value = this.currentSettings.borderColor;
        document.getElementById('borderWidth').value = this.currentSettings.borderWidth;
        document.getElementById('borderRadius').value = this.currentSettings.borderRadius;
        document.getElementById('description').value = photo.description || '';
        
        this.updateUIDisplay();
    }

    updatePhotoCounter() {
        document.getElementById('photoCounter').textContent = `${this.currentIndex + 1}/${this.photos.length}`;
    }

    savePreset() {
        const presetName = document.getElementById('presetName').value.trim();
        if (!presetName) {
            alert('Escribe un nombre para el preset');
            return;
        }

        const preset = {
            name: presetName,
            settings: JSON.parse(JSON.stringify(this.currentSettings)),
            photos: JSON.parse(JSON.stringify(this.photos)),
            timestamp: new Date().toISOString()
        };

        this.presets.push(preset);
        this.savePresetsToStorage();
        this.renderPresetList();
        document.getElementById('presetName').value = '';
    }

    renderPresetList() {
        const presetList = document.getElementById('presetList');
        presetList.innerHTML = '';

        this.presets.forEach((preset, index) => {
            const presetItem = document.createElement('div');
            presetItem.className = 'preset-item';
            presetItem.innerHTML = `
                <span>${preset.name} (${preset.photos.length} fotos)</span>
                <div style="display: flex; gap: 4px;">
                    <button class="load-btn">Cargar</button>
                    <button class="delete-btn">✕</button>
                </div>
            `;

            presetItem.querySelector('.load-btn').addEventListener('click', () => this.loadPreset(index));
            presetItem.querySelector('.delete-btn').addEventListener('click', () => this.deletePreset(index));

            presetList.appendChild(presetItem);
        });
    }

    loadPreset(index) {
        const preset = this.presets[index];
        this.photos = JSON.parse(JSON.stringify(preset.photos));
        this.currentSettings = JSON.parse(JSON.stringify(preset.settings));
        this.currentIndex = 0;
        this.savePhotosToStorage();
        this.renderPhotoList();
        this.loadSettingsUI();
        this.updatePreview();
    }

    deletePreset(index) {
        if (confirm('¿Eliminar este preset?')) {
            this.presets.splice(index, 1);
            this.savePresetsToStorage();
            this.renderPresetList();
        }
    }

    exportConfig() {
        const config = {
            photos: this.photos,
            settings: this.currentSettings,
            presets: this.presets,
            version: '1.0'
        };

        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ave-contenidos-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importConfig(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                this.photos = config.photos || [];
                this.currentSettings = config.settings || this.currentSettings;
                this.presets = config.presets || [];
                this.currentIndex = 0;

                this.savePhotosToStorage();
                this.savePresetsToStorage();
                this.renderPhotoList();
                this.renderPresetList();
                this.loadSettingsUI();
                this.updatePreview();

                alert('Configuración importada correctamente');
            } catch (error) {
                alert('Error al importar: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    savePhotosToStorage() {
        const data = {
            photos: this.photos,
            settings: this.currentSettings
        };
        localStorage.setItem('ave-photos', JSON.stringify(data));
    }

    loadPhotosFromStorage() {
        const data = localStorage.getItem('ave-photos');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.photos = parsed.photos || [];
                this.currentSettings = parsed.settings || this.currentSettings;
                this.renderPhotoList();
                if (this.photos.length > 0) {
                    this.updatePreview();
                }
            } catch (error) {
                console.error('Error cargando fotos:', error);
            }
        }
    }

    savePresetsToStorage() {
        localStorage.setItem('ave-presets', JSON.stringify(this.presets));
    }

    loadPresetsFromStorage() {
        const data = localStorage.getItem('ave-presets');
        if (data) {
            try {
                this.presets = JSON.parse(data);
                this.renderPresetList();
            } catch (error) {
                console.error('Error cargando presets:', error);
            }
        }
    }

    handleKeyPress(e) {
        if (e.key === 'ArrowRight') this.nextPhoto();
        if (e.key === 'ArrowLeft') this.previousPhoto();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AveCarousel();
} ;
