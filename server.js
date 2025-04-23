const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Configurar o banco de dados SQLite
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
    console.error('Erro na aplicação:', err.stack);
    res.status(500).json({
        error: true,
        message: 'Ocorreu um erro interno no servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// Middleware de validação de dados
const validateProduct = (req, res, next) => {
    const { name, price, quantity } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: true, message: 'Nome do produto é obrigatório' });
    }
    
    if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: true, message: 'Preço inválido' });
    }
    
    if (!quantity || isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ error: true, message: 'Quantidade inválida' });
    }
    
    next();
};

// Criar tabela de produtos
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, quantity INTEGER)", (err) => {
        if (err) {
            console.error('Erro ao criar tabela:', err.message);
        }
    });
});

// Rotas da API
app.post('/api/products', validateProduct, (req, res) => {
    const { name, price, quantity, category } = req.body;
    
    db.run("INSERT INTO products (name, price, quantity) VALUES (?, ?, ?)", 
        [name.trim(), price, quantity, category.trim()], 
        function(err) {
            if (err) {
                console.error('Erro ao inserir produto:', err);
                return res.status(500).json({ error: true, message: 'Erro ao criar produto' });
            }
            res.status(201).json({ 
                success: true,
                id: this.lastID,
                name,
                price,
                quantity,
                category,
                message: 'Produto criado com sucesso'
            });
        }
    );
});

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar produtos:', err);
            return res.status(500).json({ error: true, message: 'Erro ao buscar produtos' });
        }
        res.json({ success: true, data: rows });
    });
});

app.put('/api/products/:id', validateProduct, (req, res) => {
    const { id } = req.params;
    const { name, price, quantity } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: true, message: 'ID inválido' });
    }

    db.run("UPDATE products SET name = ?, price = ?, quantity = ? WHERE id = ?",
        [name.trim(), price, quantity, id],
        function(err) {
            if (err) {
                console.error('Erro ao atualizar produto:', err);
                return res.status(500).json({ error: true, message: 'Erro ao atualizar produto' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: true, message: 'Produto não encontrado' });
            }
            res.json({ 
                success: true,
                id, 
                name, 
                price, 
                quantity,
                message: 'Produto atualizado com sucesso'
            });
        }
    );
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: true, message: 'ID inválido' });
    }

    db.run("DELETE FROM products WHERE id = ?", id, function(err) {
        if (err) {
            console.error('Erro ao deletar produto:', err);
            return res.status(500).json({ error: true, message: 'Erro ao deletar produto' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: true, message: 'Produto não encontrado' });
        }
        res.json({ 
            success: true,
            message: 'Produto deletado com sucesso',
            deleted: this.changes 
        });
    });
});

// Rota para lidar com requisições não encontradas
app.use((req, res) => {
    res.status(404).json({ error: true, message: 'Rota não encontrada' });
});

// Aplicar middleware de tratamento de erros
app.use(errorHandler);

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
