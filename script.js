
(() => {
  
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const addBtn = document.getElementById('addBtn');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('form');
  const tableBody = document.querySelector('#dataTable tbody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterMajor = document.getElementById('filterMajor');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const aboutSection = document.getElementById('about');
  const listSection = document.getElementById('list');
  const navLinks = document.querySelectorAll('.sidebar nav a');

  
  const studentId = document.getElementById('studentId');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const majorInput = document.getElementById('major');
  const ageInput = document.getElementById('age');
  const modalTitle = document.getElementById('modalTitle');

  
  const STORAGE_KEY = 'responsi_mahasiswa_v1';

  
  let students = [];

  
  const uid = () => 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

  function saveToStorage(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }
  function loadFromStorage(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      students = raw ? JSON.parse(raw) : [];
    } catch(e){
      students = [];
    }
  }

  
  function renderTable(){
    const q = searchInput.value.trim().toLowerCase();
    const majorFilter = filterMajor.value;
    const filtered = students.filter(s => {
      const matchesQ = !q || (s.name.toLowerCase().includes(q) || s.major.toLowerCase().includes(q));
      const matchesMajor = !majorFilter || s.major === majorFilter;
      return matchesQ && matchesMajor;
    });

    tableBody.innerHTML = '';
    if(filtered.length === 0){
      emptyState.style.display = 'block'; 
      return;
    } else emptyState.style.display = 'none';

    filtered.forEach((s, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.major)}</td>
        <td>${s.age}</td>
        <td>
          <button class="btn" data-id="${s.id}" data-action="edit">Edit</button>
          <button class="btn danger" data-id="${s.id}" data-action="delete">Hapus</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function populateMajorFilter(){
    const majors = Array.from(new Set(students.map(s => s.major))).sort();
    filterMajor.innerHTML = '<option value="">Semua Jurusan</option>';
    majors.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      filterMajor.appendChild(opt);
    });
  }

  
  function addStudent(payload){
    students.push({ id: uid(), ...payload });
    saveToStorage();
    populateMajorFilter();
    renderTable();
  }
  function updateStudent(id, payload){
    const idx = students.findIndex(s => s.id === id);
    if(idx > -1){ students[idx] = { ...students[idx], ...payload }; saveToStorage(); renderTable(); populateMajorFilter(); }
  }
  function deleteStudent(id){
    students = students.filter(s => s.id !== id);
    saveToStorage(); renderTable(); populateMajorFilter();
  }

  
  function openModal(edit = false, data = null){
    modal.classList.remove('hidden');
    if(edit && data){
      modalTitle.textContent = 'Edit Mahasiswa';
      studentId.value = data.id;
      nameInput.value = data.name;
      emailInput.value = data.email;
      majorInput.value = data.major;
      ageInput.value = data.age;
    } else {
      modalTitle.textContent = 'Tambah Mahasiswa';
      studentId.value = '';
      form.reset();
    }
    nameInput.focus();
  }
  function closeModal(){
    modal.classList.add('hidden');
  }

  
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  
  menuToggle.addEventListener('click', e => sidebar.classList.toggle('open'));
  addBtn.addEventListener('click', () => openModal(false));
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      major: majorInput.value.trim(),
      age: Number(ageInput.value)
    };
    
    if(!payload.name || !payload.email || !payload.major || !payload.age){ alert('Isi semua field'); return; }
    const id = studentId.value;
    if(id){
      updateStudent(id, payload);
    } else {
      addStudent(payload);
    }
    closeModal();
  });

  tableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if(action === 'edit'){
      const data = students.find(s => s.id === id);
      if(data) openModal(true, data);
    } else if(action === 'delete'){
      openConfirm(id);
    }
  });

  
  let pendingDeleteId = null;
  function openConfirm(id){
    pendingDeleteId = id;
    document.getElementById('confirm').classList.remove('hidden');
  }
  document.getElementById('confirmNo').addEventListener('click', () => {
    pendingDeleteId = null; document.getElementById('confirm').classList.add('hidden');
  });
  document.getElementById('confirmYes').addEventListener('click', () => {
    if(pendingDeleteId) deleteStudent(pendingDeleteId);
    pendingDeleteId = null; document.getElementById('confirm').classList.add('hidden');
  });

  
  searchInput.addEventListener('input', renderTable);
  filterMajor.addEventListener('change', renderTable);

  
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(students, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mahasiswa.json'; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if(Array.isArray(parsed)){
          
          parsed.forEach(p => {
            if(p.name && p.email) students.push({ id: uid(), name: p.name, email: p.email, major: p.major || 'Unknown', age: p.age || 0 });
          });
          saveToStorage();
          populateMajorFilter(); renderTable();
          alert('Import berhasil');
        } else alert('File tidak sesuai');
      } catch(err){
        alert('Gagal membaca file');
      }
    };
    reader.readAsText(f);
    importFile.value = '';
  });

  
  navLinks.forEach(a => a.addEventListener('click', (ev) => {
    ev.preventDefault();
    navLinks.forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    const section = a.dataset.section;
    if(section === 'about'){ aboutSection.classList.remove('hidden'); listSection.classList.add('hidden'); }
    else { aboutSection.classList.add('hidden'); listSection.classList.remove('hidden'); }
  }));

  
  function seedIfEmpty(){
    if(students.length === 0){
      students = [
        { id: uid(), name: 'Alya Putri', email: 'alya@mail.com', major: 'Teknik Informatika', age: 20 },
        { id: uid(), name: 'Budi Santoso', email: 'budi@mail.com', major: 'Sistem Informasi', age: 21 },
        { id: uid(), name: 'Citra Dewi', email: 'citra@mail.com', major: 'Teknik Informatika', age: 19 }
      ];
      saveToStorage();
    }
  }

  
  loadFromStorage();
  seedIfEmpty();
  populateMajorFilter();
  renderTable();

  
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      if(!modal.classList.contains('hidden')) closeModal();
      const conf = document.getElementById('confirm');
      if(!conf.classList.contains('hidden')) conf.classList.add('hidden');
    }
  });
})();

