const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Caminho do arquivo para armazenar os dados
const DATA_FILE = path.join(__dirname, 'leads.json');

// Função para carregar os dados do arquivo JSON
const loadLeads = () => {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  }
  return [];
};

// Função para salvar os dados no arquivo JSON
const saveLeads = (leads) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));
};

// Carrega os dados ao iniciar o servidor
let leads = loadLeads();

// Rota para receber os dados do formulário
app.post('/submit', (req, res) => {
  const formData = req.body;

  // Validação simples
  if (!formData.name || !formData.email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
  }

  leads.push(formData);
  saveLeads(leads); // Salva os dados no arquivo
  console.log('Dados recebidos:', formData);

  res.status(200).json({ message: 'Dados recebidos com sucesso!' });
});

// Rota para baixar os dados em formato CSV
app.get('/download', (req, res) => {
  if (leads.length === 0) {
    return res.status(404).json({ error: 'Nenhum dado disponível para download.' });
  }

  const fields = ['name', 'email', 'whatsapp', 'studentName', 'studentAge'];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(leads);

  const filePath = path.join(__dirname, 'leads.csv');
  fs.writeFileSync(filePath, csv);

  res.download(filePath, 'leads.csv', (err) => {
    if (err) {
      console.error('Erro ao enviar o arquivo:', err);
      res.status(500).json({ error: 'Erro ao enviar o arquivo.' });
    }
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});