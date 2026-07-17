# Guia de Implementação SSL para Life Systems API

Este guia fornece instruções completas para implementar SSL/TLS no projeto Life Systems API na VM da Azure.

## 🚀 Implementação Rápida

### Pré-requisitos
- VM na Azure com Ubuntu 20.04+
- Domínio apontando para o IP da VM (20.201.114.238)
- Acesso SSH à VM
- Projeto Life Systems API rodando na VM

### Passo 1: Conectar à VM
```bash
ssh -i "C:\Users\hrrsn\Downloads\Cobe-Ale_key-1.pem" azureuser@20.201.114.238
```

### Passo 2: Navegar para o projeto
```bash
cd tecnoaging-back
```

### Passo 3: Executar o script de configuração SSL
```bash
# Tornar o script executável
chmod +x scripts/setup-ssl.sh

# Executar o script (substitua pelo seu domínio e email)
./scripts/setup-ssl.sh seu-dominio.com seu-email@exemplo.com
```

### Passo 4: Configurar renovação automática
```bash
# Tornar o script executável
chmod +x scripts/setup-ssl-cron.sh

# Configurar cron job para renovação automática
./scripts/setup-ssl-cron.sh seu-dominio.com
```

### Passo 5: Atualizar variáveis de ambiente
Edite o arquivo `.env`:
```bash
nano .env
```

Atualize as seguintes variáveis:
```env
# CORS Configuration
CORS_ORIGIN="https://seu-dominio.com"

# Application Configuration
PORT=3000
NODE_ENV=production
```

### Passo 6: Reiniciar a aplicação
```bash
# Reiniciar com PM2
pm2 restart tecno-aging-api

# Verificar status
pm2 status
```

## 🔧 Configuração Manual (Alternativa)

Se preferir configurar manualmente:

### 1. Instalar Nginx e Certbot
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configurar Nginx
```bash
# Copiar configuração SSL
sudo cp nginx/tecno-aging-ssl.conf /etc/nginx/sites-available/tecno-aging-ssl

# Substituir domínio na configuração
sudo sed -i 's/your-domain.com/seu-dominio.com/g' /etc/nginx/sites-available/tecno-aging-ssl

# Habilitar o site
sudo ln -s /etc/nginx/sites-available/tecno-aging-ssl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Obter certificado SSL
```bash
sudo certbot --nginx -d seu-dominio.com
```

### 4. Configurar renovação automática
```bash
sudo crontab -e
```

Adicionar a linha:
```
0 */12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

## 🛡️ Recursos de Segurança Implementados

### SSL/TLS
- TLS 1.2 e 1.3
- Ciphers seguros
- HSTS (HTTP Strict Transport Security)
- Certificados Let's Encrypt com renovação automática

### Headers de Segurança
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy

### Rate Limiting
- 10 requisições por segundo por IP
- Burst de 20 requisições

### Firewall
- Portas 80 (HTTP) e 443 (HTTPS) abertas
- SSH configurado
- UFW habilitado

## 📊 Monitoramento e Manutenção

### Verificar Status do SSL
```bash
# Status dos certificados
sudo certbot certificates

# Testar renovação
sudo certbot renew --dry-run

# Verificar expiração
openssl x509 -in /etc/letsencrypt/live/seu-dominio.com/cert.pem -text -noout | grep "Not After"
```

### Logs
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/tecno-aging-access.log
sudo tail -f /var/log/nginx/tecno-aging-error.log

# Logs de renovação SSL
tail -f /var/log/ssl-renewal.log

# Logs da aplicação
pm2 logs tecno-aging-api
```

### Testar SSL
```bash
# Teste local
curl -I https://seu-dominio.com/status

# Teste de conectividade SSL
openssl s_client -connect seu-dominio.com:443 -servername seu-dominio.com

# Teste online (recomendado)
# Visite: https://www.ssllabs.com/ssltest/analyze.html?d=seu-dominio.com
```

## 🔄 Renovação Manual

### Forçar Renovação
```bash
# Usando o script personalizado
./scripts/ssl-renewal.sh seu-dominio.com force

# Usando certbot diretamente
sudo certbot renew --force-renewal
```

### Verificar Cron Jobs
```bash
# Listar cron jobs
crontab -l

# Editar cron jobs
crontab -e
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Certificado não obtido
```bash
# Verificar se o domínio aponta para a VM
nslookup seu-dominio.com

# Verificar se a porta 80 está aberta
sudo ufw status
```

#### 2. Nginx não inicia
```bash
# Testar configuração
sudo nginx -t

# Verificar logs
sudo journalctl -u nginx -f
```

#### 3. Aplicação não responde via HTTPS
```bash
# Verificar se a aplicação está rodando
pm2 status

# Testar localmente
curl http://localhost:3000/status

# Verificar logs da aplicação
pm2 logs tecno-aging-api
```

#### 4. CORS errors
```bash
# Verificar configuração CORS no .env
cat .env | grep CORS

# Reiniciar aplicação
pm2 restart tecno-aging-api
```

### Comandos de Diagnóstico
```bash
# Status geral do sistema
sudo systemctl status nginx
sudo systemctl status tecno-aging-api
pm2 status

# Verificar portas
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3000

# Verificar certificados
sudo certbot certificates
sudo ls -la /etc/letsencrypt/live/
```

## 📝 Checklist de Implementação

- [ ] Domínio configurado e apontando para a VM
- [ ] Script SSL executado com sucesso
- [ ] Certificado SSL obtido
- [ ] Nginx configurado e funcionando
- [ ] Aplicação reiniciada
- [ ] HTTPS funcionando (teste manual)
- [ ] Renovação automática configurada
- [ ] Logs funcionando
- [ ] Firewall configurado
- [ ] Teste de segurança SSL realizado

## 🔗 Links Úteis

- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Certbot Documentation](https://certbot.eff.org/docs/)

## 📞 Suporte

Se encontrar problemas durante a implementação:

1. Verifique os logs de erro
2. Consulte a seção de troubleshooting
3. Teste cada componente individualmente
4. Verifique se todos os pré-requisitos foram atendidos

---

**Nota**: Este guia assume que você tem acesso SSH à VM e que o projeto Life Systems API já está rodando. Certifique-se de substituir `seu-dominio.com` pelo seu domínio real em todos os comandos.
