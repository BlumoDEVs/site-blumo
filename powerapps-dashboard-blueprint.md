# Blueprint Power Apps (Canvas) — Importável

Este guia foi reestruturado para ficares com algo **importável** no Power Apps, em vez de apenas documentação visual.

## O que vais conseguir no fim

- Uma app Canvas com estrutura pronta:
  - `scrHome` (dashboard)
  - componentes reutilizáveis (`cmpHeader`, `cmpKpiCard`, `cmpBottomNav`)
  - coleções de dados demo
- Exportação para `.msapp` para reutilizar/importar noutro ambiente.

---

## Opção 1 (recomendada): criar e exportar um `.msapp` em 10–15 min

> Nota importante: um ficheiro `.msapp` final só pode ser gerado dentro do Power Apps Studio (ou via CLI com app já construída).  
> Por isso, abaixo tens um processo objetivo para ficares com o pacote importável imediatamente.

### 1) Criar app em branco

1. Abrir [https://make.powerapps.com](https://make.powerapps.com)
2. **Create** → **Canvas app from blank**
3. Nome sugerido: `BlumoDashboard`
4. Formato: **Tablet**

### 2) Definir tema e dados no `App.OnStart`

Cola isto no `App.OnStart`:

```powerfx
Set(thm,
{
    bg: ColorValue("#F5F7FB"),
    card: Color.White,
    text: ColorValue("#0F172A"),
    subtext: ColorValue("#64748B"),
    primary: ColorValue("#2563EB"),
    success: ColorValue("#16A34A"),
    warning: ColorValue("#F59E0B"),
    danger: ColorValue("#DC2626"),
    border: ColorValue("#E2E8F0")
}
);

ClearCollect(colKPI,
    {Title:"Vendas", Value:128430, Delta:0.12, Icon:"Money"},
    {Title:"Encomendas", Value:932, Delta:0.08, Icon:"Cart"},
    {Title:"Clientes", Value:421, Delta:0.05, Icon:"People"},
    {Title:"Taxa Conversão", Value:0.034, Delta:-0.01, Icon:"Chart"}
);

ClearCollect(colRecent,
    {Code:"#A102", Client:"Contoso", Amount:1240, Status:"Concluído", Dt:Today()-1},
    {Code:"#A103", Client:"Northwind", Amount:870, Status:"Pendente", Dt:Today()-2},
    {Code:"#A104", Client:"Litware", Amount:1540, Status:"Concluído", Dt:Today()-3},
    {Code:"#A105", Client:"Fabrikam", Amount:430, Status:"Em risco", Dt:Today()-4}
);

ClearCollect(colTrendRaw,
    {Dt:Today()-6, Total:12500},
    {Dt:Today()-5, Total:13100},
    {Dt:Today()-4, Total:12820},
    {Dt:Today()-3, Total:14210},
    {Dt:Today()-2, Total:15100},
    {Dt:Today()-1, Total:14980},
    {Dt:Today(), Total:15840}
);
```

Depois executa `App > Run OnStart`.

### 3) Estrutura do ecrã (`scrHome`)

- Fundo do ecrã: `thm.bg`
- Container vertical principal (`conMain`):
  - `conHeader` (altura 72)
  - `conWelcome` (altura 96)
  - `galKPI` (4 cards, horizontal)
  - `conStatsQuick` (grid 2x2)
  - `conTrend` (gráfico de linha com `colTrendRaw`)
  - `galRecent` (registos recentes)
  - `conBottomNav` (altura 64)

### 4) Componentes reutilizáveis mínimos

Criar em **Components**:

1. `cmpHeader`
   - Props: `Title` (Text), `UserName` (Text)
2. `cmpKpiCard`
   - Props: `Title`, `ValueText`, `Delta`, `IconName`
3. `cmpBottomNav`
   - Props: `ActiveKey` (Text)

### 5) Exportar `.msapp`

1. **File** → **Save**
2. **File** → **Export package** (ou **Save as** consoante tenant/UI)
3. Escolher formato/app package e descarregar

Resultado: ficas com o **`.msapp` pronto para importar** em outro ambiente.

---

## Opção 2: importação via Power Platform CLI (equipa técnica)

Se preferires pipeline:

1. Construir app no Studio
2. Exportar `.msapp`
3. Versionar no Git com unpack/pack

Exemplo de comandos (local com `pac` instalado):

```bash
pac canvas unpack --msapp BlumoDashboard.msapp --sources ./src
# editar/controlar versão dos fontes
pac canvas pack --sources ./src --msapp BlumoDashboard.msapp
```

---

## Fórmulas úteis já prontas

### KPI galeria

- `galKPI.Items`:

```powerfx
colKPI
```

- Valor formatado no card:

```powerfx
If(
    ThisItem.Title = "Taxa Conversão",
    Text(ThisItem.Value, "0.0%"),
    Text(ThisItem.Value, "[$-pt-PT]#,##0")
)
```

### Registos recentes

- `galRecent.Items`:

```powerfx
SortByColumns(colRecent, "Dt", Descending)
```

### Cor de estado

```powerfx
Switch(
    ThisItem.Status,
    "Concluído", thm.success,
    "Pendente", thm.warning,
    "Em risco", thm.danger,
    thm.subtext
)
```

---

## Checklist final (para garantir importação sem erros)

- [ ] `App.OnStart` sem erros
- [ ] Todos os componentes criados (`cmpHeader`, `cmpKpiCard`, `cmpBottomNav`)
- [ ] `scrHome` abre sem erros de fórmula
- [ ] App guardada antes de exportar
- [ ] `.msapp` testado por importação noutro environment

---

Se quiseres, no próximo passo eu também te posso montar a versão **“nomenclatura enterprise”** (prefixos `scr/gal/cmp/con/lbl/ico`) e um **script de validação pré-export**.
