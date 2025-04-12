require('dotenv').config(); // Adicionado para carregar variáveis de ambiente
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Adicionado para realizar requisições HTTP

const app = express();
const PORT = 80;

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

// Função para enviar mensagem via API Evolution
const sendWhatsAppMessage = async (formData) => {
  const apiUrl = 'https://evolutionapi.styxx.cloud';
  const instanceName = 'autosg';
  const phoneNumber = '5511930651948';
  const apiKey = process.env.EVOLUTION_API_KEY; // Obtém a API key do .env
  const message = `Novo formulário recebido:\nNome: ${formData.name}\nEmail: ${formData.email}\nWhatsApp: ${formData.whatsapp || 'N/A'}\nNome do Aluno: ${formData.studentName || 'N/A'}\nIdade do Aluno: ${formData.studentAge || 'N/A'}`;

  try {
    await axios.post(`${apiUrl}/message/sendText/${instanceName}`, {
      number: phoneNumber,
      textMessage: {
        text: message,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
    });
    console.log('Mensagem enviada com sucesso para o WhatsApp.');
  } catch (error) {
    console.error('Erro ao enviar mensagem para o WhatsApp:', error.response?.data || error.message);
  }
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

  // Envia mensagem via API Evolution
  sendWhatsAppMessage(formData);

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