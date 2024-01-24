document.addEventListener('DOMContentLoaded', function () {
    // Fonction pour récupérer les données depuis l'API avec authentification
    function fetchData(url, method = 'GET', data = null) {
        const credentials = promptCredentials();
        if (!credentials) {
            return Promise.reject(new Error('Authentication canceled'));
        }

        return fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(credentials),
            },
            body: data ? JSON.stringify(data) : null,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} - ${response.statusText}`);
                }
                return response.json();
            })
            .catch(error => {
                if (error.message === 'Authentication canceled') {
                   
                } else if (error.message.startsWith('Error: 401')) {
                    
                    alert('Authentication failed. Please log in again.');
                    sessionStorage.removeItem('credentials');
                } else {
                    console.error('Error fetching data:', error.message);
                }

                throw error;
            });
    }

    // Fonction pour afficher la liste des étudiants
    function displayStudents() {
        const studentTable = document.getElementById('student-table');
        studentTable.innerHTML = '';

        fetchData('http://localhost:3000/api/students')
            .then(students => {
                const tableHeader = document.createElement('tr');
                tableHeader.innerHTML = '<th>ID</th><th>Prénom</th><th>Nom</th><th>Adresse e-mail</th><th>Numéro de téléphone</th><th>Adresse postale</th><th>Code postale</th><th>Ville/vilage</th><th>Classe</th><th><i class="fa-solid fa-trash"></i></th>';
                studentTable.appendChild(tableHeader);

                students.forEach(student => {
                    const tableRow = document.createElement('tr');
                    tableRow.innerHTML = `<td data-field="id">${student.id}</td><td data-field="firstname">${student.firstname}</td><td data-field="lastname">${student.lastname}</td><td data-field="email">${student.email}</td><td data-field="phone">${student.phone}</td><td data-field="address">${student.address}</td><td data-field="zip">${student.zip}</td><td data-field="city">${student.city}</td><td data-field="class">${student.class}</td>`;
                    
                    // Ajout du bouton de suppression pour chaque étudiant
                    const deleteButton = document.createElement('i');
                    deleteButton.className = 'trash fas fa-trash';
                    deleteButton.setAttribute('data-id', student.id);
                    deleteButton.addEventListener('click', deleteStudent);
                    
                    const actionCell = document.createElement('td');
                    actionCell.appendChild(deleteButton);
                    tableRow.appendChild(actionCell);

                    // Ajout de l'événement de modification pour chaque cellule
                    tableRow.addEventListener('click', editCell);

                    studentTable.appendChild(tableRow);
                });
            })
            .catch(error => {
                console.error('Error displaying students:', error.message);
                studentTable.innerHTML = '<tr><td colspan="10">Error fetching students</td></tr>';
            });
    }

    // Fonction pour afficher la liste des classes
    function displayClasses() {
        const classTable = document.getElementById('class-table');
        classTable.innerHTML = '';

        fetchData('http://localhost:3000/api/classes')
            .then(classes => {
                const tableHeader = document.createElement('tr');
                tableHeader.innerHTML = '<th>ID</th><th>Nom de la classe</th><th>Niveau</th><th><i class="fa-solid fa-trash"></i></th>';
                classTable.appendChild(tableHeader);

                classes.forEach(cls => {
                    const tableRow = document.createElement('tr');
                    tableRow.innerHTML = `<td data-field="id">${cls.id}</td><td data-field="name">${cls.name}</td><td data-field="level">${cls.level}</td>`;
                    
                    // Ajout du bouton de suppression pour chaque classe
                    const deleteButton = document.createElement('i');
                    deleteButton.className = 'trash fas fa-trash';
                    deleteButton.setAttribute('data-id', cls.id);
                    deleteButton.addEventListener('click', deleteClass);
                    
                    const actionCell = document.createElement('td');
                    actionCell.appendChild(deleteButton);
                    tableRow.appendChild(actionCell);

                    // Ajout de l'événement de modification pour chaque cellule
                    tableRow.addEventListener('click', editCell);

                    classTable.appendChild(tableRow);
                });
            })
            .catch(error => {
                console.error('Error displaying classes:', error.message);
                classTable.innerHTML = '<tr><td colspan="4">Error fetching classes</td></tr>';
            });
    }

    // Fonction pour supprimer un étudiant
    function deleteStudent(event) {
        const studentId = event.target.getAttribute('data-id');
        fetchData(`http://localhost:3000/api/students/${studentId}`, 'DELETE')
            .then(() => displayStudents())
            .catch(error => console.error('Error deleting student:', error.message));
    }

    // Fonction pour supprimer une classe
    function deleteClass(event) {
        const classId = event.target.getAttribute('data-id');
        fetchData(`http://localhost:3000/api/classes/${classId}`, 'DELETE')
            .then(() => displayClasses())
            .catch(error => console.error('Error deleting class:', error.message));
    }

    // Fonction pour éditer une cellule
    function editCell(event) {
        const targetCell = event.target;
        if (targetCell.tagName === 'TD') {
            const currentValue = targetCell.textContent;
            const newValue = prompt(`Enter new value for ${targetCell.dataset.field}:`, currentValue);
            if (newValue !== null && newValue !== currentValue) {
                const rowId = targetCell.parentNode.querySelector('[data-field="id"]').textContent;
                const fieldName = targetCell.dataset.field;
                const updateData = { [fieldName]: newValue };
    
                // Mettre à jour la valeur côté serveur
                fetchData(`http://localhost:3000/api/classes/${rowId}`, 'PATCH', updateData)
                    .then(() => {

                        // Mettre à jour la valeur côté client
                        targetCell.textContent = newValue;
                    })
                    .catch(error => console.error('Error updating cell:', error.message));
                // Mettre à jour la valeur côté serveur
                fetchData(`http://localhost:3000/api/students/${rowId}`, 'PATCH', updateData)
                    .then(() => {

                        // Mettre à jour la valeur côté client
                        targetCell.textContent = newValue;
                    })
                    .catch(error => console.error('Error updating cell:', error.message));
            } else {
                console.error('Error: Invalid or unchanged value entered.');
            }
            
        }
        
    }

    // Afficher la liste initiale
    displayStudents();
    displayClasses();

    // Gérer l'ajout d'un étudiant
    document.getElementById('add-student').addEventListener('click', function () {
        const newStudent = {
            firstname: prompt('Prénom :'),
            lastname: prompt('Nom :'),
            email: prompt('Adresse e-mail :'),
            phone: prompt('Numéro de téléphone :'),
            address: prompt('Adresse postale :'),
            zip: prompt('Code postale :'),
            city: prompt('Ville/Vilage :'),
            class: prompt('Classe :'),
        };

        fetchData('http://localhost:3000/api/students', 'POST', newStudent)
            .then(() => displayStudents())
            .catch(error => console.error('Error adding student:', error.message));
    });

    // Gérer l'ajout d'une classe
    document.getElementById('add-class').addEventListener('click', function () {
        const newClass = {
            name: prompt('Nom de la classe :'),
            level: prompt('Niveau de la classe :'),
        };

        fetchData('http://localhost:3000/api/classes', 'POST', newClass)
            .then(() => displayClasses())
            .catch(error => console.error('Error adding class:', error.message));
    });

    // Fonction pour demander les identifiants
    function promptCredentials() {
        const storedCredentials = sessionStorage.getItem('credentials');
        if (storedCredentials) {
            return storedCredentials;
        }

        const username = prompt('Enter your username:');
        const password = prompt('Enter your password:');

        if (username && password) {
            const credentials = `${username}:${password}`;
            sessionStorage.setItem('credentials', credentials);
            return credentials;
        } else {
            return null;
        }
    }
});



//   ▄▄▄▄▄ ████▄ ▀▄    ▄ ▄███▄     ▄       ▄        ▄   ████▄ ▄███▄   █     
// ▄▀  █   █   █   █  █  █▀   ▀     █  ▀▄   █        █  █   █ █▀   ▀  █     
//     █   █   █    ▀█   ██▄▄    █   █   █ ▀     ██   █ █   █ ██▄▄    █     
//  ▄ █    ▀████    █    █▄   ▄▀ █   █  ▄ █      █ █  █ ▀████ █▄   ▄▀ ███▄  
//   ▀            ▄▀     ▀███▀   █▄ ▄█ █   ▀▄    █  █ █       ▀███▀       ▀ 
//                                ▀▀▀   ▀        █   ██                     
                                                                         