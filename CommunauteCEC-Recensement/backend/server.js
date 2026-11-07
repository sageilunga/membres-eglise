const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = 5000;
const FILE_PATH = path.join(__dirname, 'membres_eglise.xlsx');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialiser le fichier Excel s'il n'existe pas
function initExcelFile() {
  if (!fs.existsSync(FILE_PATH)) {
    const defaultData = [
      {
        id: "1",
        nom: "Kabamba",
        prenom: "Jean",
        genre: "Homme",
        dateNaissance: "1988-04-12",
        telephone: "+243 810 000 001",
        email: "jean.kabamba@example.com",
        adresse: "Kinshasa, Gombe",
        etatCivil: "Marié(e)",
        nomConjoint: "Marie Kabamba",
        nombreEnfants: 3,
        dateBapteme: "2010-06-15",
        estBaptise: true,
        departement: "Chorale",
        statut: "Actif",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      }
    ];
    saveToExcel(defaultData);
    console.log("Fichier membres_eglise.xlsx créé avec succès !");
  }
}

// Lire les données Excel
function readFromExcel() {
  const workbook = XLSX.readFile(FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

// Écrire dans le fichier Excel
function saveToExcel(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");
  XLSX.writeFile(workbook, FILE_PATH);
}

// --- Routes API ---

app.get('/api/membres', (req, res) => {
  try {
    const membres = readFromExcel();
    res.json(membres);
  } catch (error) {
    res.status(500).json({ error: "Erreur de lecture du fichier Excel" });
  }
});

app.post('/api/membres', (req, res) => {
  try {
    const membres = readFromExcel();
    const nouveauMembre = { id: Date.now().toString(), ...req.body };
    membres.push(nouveauMembre);
    saveToExcel(membres);
    res.status(201).json(nouveauMembre);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement dans Excel" });
  }
});

app.put('/api/membres/:id', (req, res) => {
  try {
    const { id } = req.params;
    let membres = readFromExcel();
    const index = membres.findIndex(m => String(m.id) === String(id));
    
    if (index !== -1) {
      membres[index] = { ...membres[index], ...req.body };
      saveToExcel(membres);
      res.json(membres[index]);
    } else {
      res.status(404).json({ error: "Membre non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur de mise à jour dans Excel" });
  }
});

app.delete('/api/membres/:id', (req, res) => {
  try {
    const { id } = req.params;
    let membres = readFromExcel();
    membres = membres.filter(m => String(m.id) !== String(id));
    saveToExcel(membres);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: "Erreur de suppression dans Excel" });
  }
});

initExcelFile();
app.listen(PORT, () => {
  console.log(`Serveur Excel démarré sur http://localhost:${PORT}`);
});
