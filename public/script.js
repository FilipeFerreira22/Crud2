document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('productForm');
    const messageDiv = document.getElementById('message');
    const tableBody = document.querySelector('#productsTable tbody');

    // Função para mostrar mensagens
    function showMessage(message, isError = false) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${isError ? 'error' : 'success'}`;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 3000);
    }

    // Função para validar dados do formulário
    function validateFormData(name, price, quantity, category) {
        if (!name || name.trim().length === 0) {
            throw new Error('Nome do produto é obrigatório');
        }
        if (!price || isNaN(price) || price <= 0) {
            throw new Error('Preço inválido');
        }
        if (!quantity || isNaN(quantity) || quantity < 0) {
            throw new Error('Quantidade inválida');
        }
        if (!category || category.trim().length === 0) {
            throw new Error('Categoria é obrigatória');
        }
    }

    // Função para lidar com erros de resposta da API
    function handleApiError(response, data) {
        if (!response.ok) {
            throw new Error(data.message || 'Erro na operação');
        }
        return data;
    }

    // Função para carregar produtos
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Erro ao carregar produtos');
            }

            tableBody.innerHTML = '';
            
            if (result.data.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="5" class="empty-message">Nenhum produto cadastrado</td>';
                tableBody.appendChild(tr);
                return;
            }
            
            result.data.forEach(product => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>R$ ${product.price.toFixed(2)}</td>
                    <td>${product.quantity}</td>
                    <td>${product.category}</td>
                        <button onclick="deleteProduct(${product.id})" class="delete-btn">
                            <i class="fas fa-trash-alt"></i> Excluir
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showMessage('Erro ao carregar produtos: ' + error.message, true);
        }
    }

    // Função para cadastrar produto
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            const name = document.getElementById('name').value;
            const price = parseFloat(document.getElementById('price').value);
            const quantity = parseInt(document.getElementById('quantity').value);
            const category = document.getElementById('category').value;

            // Validar dados antes de enviar
            validateFormData(name, price, quantity, category);

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, price, quantity, category })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Erro ao cadastrar produto');
            }

            showMessage(result.message || 'Produto cadastrado com sucesso!');
            form.reset();
            loadProducts();
        } catch (error) {
            console.error('Erro ao cadastrar produto:', error);
            showMessage(error.message, true);
        }
    });

    // Função para deletar produto
    window.deleteProduct = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) {
            return;
        }

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Erro ao deletar produto');
            }

            showMessage(result.message || 'Produto deletado com sucesso!');
            loadProducts();
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            showMessage(error.message, true);
        }
    };

    // Carregar produtos ao iniciar
    loadProducts();
}); 