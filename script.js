document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const subjectNameInput = document.getElementById('subjectName');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const moduleInput = document.getElementById('moduleInput');
    const moduleNameInput = document.getElementById('moduleName');
    const moduleContentsInput = document.getElementById('moduleContents');
    const addModuleBtn = document.getElementById('addModuleBtn');
    const syllabusContainer = document.getElementById('syllabusContainer');
    const searchInput = document.getElementById('searchInput');
    
    let currentSubject = null;
    let syllabusData = loadSyllabus();
    
    // Initialize the app
    renderSyllabus();
    
    // Event Listeners
    addSubjectBtn.addEventListener('click', addSubject);
    addModuleBtn.addEventListener('click', addModule);
    document.querySelector('.search-bar button').addEventListener('click', searchTopic);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchTopic();
    });

    // Search Function (NEW - but maintains all existing functionality)
    function searchTopic() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (!searchTerm) return;

        // Clear previous highlights
        document.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
        });

        let found = false;
        
        // Search through all topics
        syllabusData.forEach(subject => {
            let subjectHasMatch = false;
            
            subject.modules.forEach(module => {
                module.topics.forEach(topic => {
                    if (topic.text.toLowerCase().includes(searchTerm)) {
                        subjectHasMatch = true;
                        found = true;
                    }
                });
            });
            
            // Expand subject if it has matches
            if (subjectHasMatch) {
                subject.expanded = true;
            }
        });

        if (found) {
            renderSyllabus();
            
            // Highlight matches after render
            setTimeout(() => {
                document.querySelectorAll('.topic-item').forEach(item => {
                    const label = item.querySelector('label');
                    if (label.textContent.toLowerCase().includes(searchTerm)) {
                        item.classList.add('highlight');
                        if (!found) { // Scroll to first match
                            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            found = true;
                        }
                    }
                });
            }, 50);
        } else {
            alert('No matching topics found');
        }
    }

    // ALL EXISTING FUNCTIONS REMAIN EXACTLY THE SAME FROM THIS POINT DOWN
    function addSubject() {
        const subjectName = subjectNameInput.value.trim();
        if (!subjectName) return;
        
        const existingSubject = syllabusData.find(subj => 
            subj.name.toLowerCase() === subjectName.toLowerCase()
        );
        
        if (existingSubject) {
            alert(`"${subjectName}" already exists. You can add modules to it.`);
            moduleInput.style.display = 'block';
            moduleNameInput.focus();
            currentSubject = existingSubject;
            return;
        }
        
        currentSubject = {
            name: subjectName,
            modules: [],
            expanded: false
        };
        
        syllabusData.push(currentSubject);
        saveSyllabus();
        renderSyllabus();
        
        subjectNameInput.value = '';
        moduleInput.style.display = 'block';
        moduleNameInput.focus();
    }
    
    function addModule() {
        if (!currentSubject) {
            alert('Please select or create a subject first');
            return;
        }
        
        const moduleName = moduleNameInput.value.trim();
        const contents = moduleContentsInput.value.trim();
        
        if (!moduleName || !contents) return;
        
        const topics = contents.split('.')
            .map(topic => topic.trim())
            .filter(topic => topic.length > 0);
        
        const module = {
            name: moduleName,
            topics: topics.map(topic => ({
                text: topic,
                completed: false
            }))
        };
        
        currentSubject.modules.push(module);
        saveSyllabus();
        renderSyllabus();
        
        moduleNameInput.value = '';
        moduleContentsInput.value = '';
        moduleNameInput.focus();
    }
    
    function renderSyllabus() {
        syllabusContainer.innerHTML = '';
        
        syllabusData.forEach((subject, subjectIndex) => {
            const subjectEl = document.createElement('div');
            subjectEl.className = 'subject';
            
            const subjectHeader = document.createElement('div');
            subjectHeader.className = 'subject-header';
            
            const icon = document.createElement('span');
            icon.className = 'toggle-icon';
            icon.textContent = subject.expanded ? '▼' : '▶';
            
            const title = document.createElement('h2');
            title.textContent = subject.name;
            
            subjectHeader.appendChild(icon);
            subjectHeader.appendChild(title);
            
            subjectHeader.addEventListener('click', function() {
                subject.expanded = !subject.expanded;
                saveSyllabus();
                renderSyllabus();
            });
            
            subjectEl.appendChild(subjectHeader);
            
            if (subject.expanded) {
                const contentContainer = document.createElement('div');
                contentContainer.className = 'subject-content';
                
                const addModuleBtn = document.createElement('button');
                addModuleBtn.className = 'add-module-btn';
                addModuleBtn.textContent = 'Add Module to This Subject';
                addModuleBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    currentSubject = subject;
                    moduleInput.style.display = 'block';
                    moduleNameInput.focus();
                });
                
                subject.modules.forEach((module, moduleIndex) => {
                    const moduleEl = document.createElement('div');
                    moduleEl.className = 'module';
                    
                    const cleanName = module.name.replace(/^(module|unit)\s*/i, '').trim();
                    const isUnit = module.name.toLowerCase().startsWith('unit');
                    const displayPrefix = isUnit ? 'Unit ' : 'Module ';
                    
                    const moduleHeader = document.createElement('h3');
                    moduleHeader.textContent = `${displayPrefix}${cleanName}`;
                    moduleEl.appendChild(moduleHeader);
                    
                    module.topics.forEach((topic, topicIndex) => {
                        const topicEl = document.createElement('div');
                        topicEl.className = `topic-item ${topic.completed ? 'completed' : ''}`;
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.className = 'topic-checkbox';
                        checkbox.checked = topic.completed;
                        checkbox.addEventListener('change', () => {
                            topic.completed = checkbox.checked;
                            saveSyllabus();
                            topicEl.classList.toggle('completed', topic.completed);
                        });
                        
                        const label = document.createElement('label');
                        label.textContent = topic.text;
                        
                        topicEl.appendChild(checkbox);
                        topicEl.appendChild(label);
                        moduleEl.appendChild(topicEl);
                    });
                    
                    contentContainer.appendChild(moduleEl);
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Delete Subject';
                deleteBtn.setAttribute('data-subject-index', subjectIndex);
                
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this subject?')) {
                        syllabusData.splice(subjectIndex, 1);
                        saveSyllabus();
                        renderSyllabus();
                        
                        if (syllabusData.length === 0) {
                            moduleInput.style.display = 'none';
                            currentSubject = null;
                        }
                    }
                });
                
                contentContainer.appendChild(addModuleBtn);
                contentContainer.appendChild(deleteBtn);
                subjectEl.appendChild(contentContainer);
            }
            
            syllabusContainer.appendChild(subjectEl);
        });
    }
    
    function saveSyllabus() {
        localStorage.setItem('syllabusData', JSON.stringify(syllabusData));
    }
    
    function loadSyllabus() {
        const data = localStorage.getItem('syllabusData');
        return data ? JSON.parse(data) : [];
    }
});
function toggleHelpModal() {
    const modal = document.getElementById("helpModal");
    modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
}
