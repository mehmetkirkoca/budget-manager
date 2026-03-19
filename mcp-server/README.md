# Budget Manager MCP Server

Bu MCP (Model Context Protocol) sunucusu, Budget Manager uygulamanızla Claude Code üzerinden etkileşim kurmanızı sağlar.

## Kurulum

1. MCP server dizinine gidin ve bağımlılıkları yükleyin:

```bash
cd mcp-server
npm install
```

2. `.env` dosyası oluşturun:

```bash
cp .env.example .env
```

3. `.env` dosyasını düzenleyin ve API URL'inizi ayarlayın:

```env
BUDGET_API_URL=http://localhost:3000/api
```

## Claude Code Yapılandırması

1. Claude Code'un MCP yapılandırma dosyasını açın:

```bash
# Linux/macOS
nano ~/.config/claude-code/mcp_config.json

# veya varsa
nano ~/.config/Code/User/globalStorage/anthropics.claude-code/settings/mcp_config.json
```

2. Aşağıdaki yapılandırmayı ekleyin (tam yolu kendi sisteminize göre güncelleyin):

```json
{
  "mcpServers": {
    "budget-manager": {
      "command": "node",
      "args": [
        "/home/mehmet/Documents/budget/mcp-server/src/index.js"
      ],
      "env": {
        "BUDGET_API_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

3. Claude Code'u yeniden başlatın.

## Kullanılabilir Araçlar

MCP sunucusu aşağıdaki araçları sağlar:

### Harcama İşlemleri

- **get_expenses**: Tüm harcamaları listeler (kategoriye göre filtreleme yapılabilir)
- **create_expense**: Yeni harcama kaydı oluşturur
- **update_expense**: Var olan harcamayı günceller
- **delete_expense**: Harcama siler
- **get_expenses_by_category**: Harcamaları kategorilere göre gruplar

### Varlık İşlemleri

- **get_assets**: Tüm varlıkları listeler
- **create_asset**: Yeni varlık oluşturur
- **update_asset**: Var olan varlığı günceller
- **delete_asset**: Varlık siler

### Özet Bilgiler

- **get_summary**: Finansal özet bilgileri getirir (toplam gelir, gider, bakiye)

## Örnek Kullanım

Claude Code içinde şunları sorabilirsiniz:

```
Bu ayki tüm harcamalarımı göster
```

```
Market kategorisinde yeni bir harcama ekle: 150 TL
```

```
Varlıklarımın listesini göster
```

```
Finansal özetimi göster
```

```
Kategorilere göre harcamalarımı grupla
```

## API Gereksinimleri

MCP sunucusunun çalışması için Budget Manager API'sinin çalışıyor olması gerekir:

```bash
# API'yi başlatmak için
cd ../api
npm run dev
```

## Geliştirme

Sunucuyu geliştirme modunda çalıştırmak için:

```bash
npm run dev
```

## Sorun Giderme

### "Connection refused" hatası

- Budget API'sinin çalıştığından emin olun (`http://localhost:3000/api`)
- `.env` dosyasındaki `BUDGET_API_URL` ayarını kontrol edin

### Claude Code MCP sunucusunu görmüyor

1. Claude Code'u tamamen kapatıp yeniden başlatın
2. MCP yapılandırma dosyasının doğru konumda olduğunu kontrol edin
3. JSON formatının geçerli olduğunu kontrol edin

### Node modülleri bulunamıyor

```bash
cd mcp-server
npm install
```

## MCP Protokolü Hakkında

MCP (Model Context Protocol), AI asistanlarının harici sistemlerle etkileşime girmesini sağlayan bir protokoldür. Daha fazla bilgi için:

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
