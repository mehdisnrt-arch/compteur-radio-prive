# Index Compteur Radio — version partagée

Application PWA pour téléphone: chaque personne entre **Date automatique + Radio + Index**.  
Les données sont enregistrées dans **un seul Google Sheet partagé**.  
L'admin peut ouvrir l'application depuis son téléphone, cliquer **Actualiser**, voir les nouveaux index, modifier, supprimer et exporter Excel.

## Radios disponibles

- Aswat
- Med Radio
- Medina FM
- Medi1
- Cap Radio
- Chada FM
- HIT RADIO
- MFM

## Ce que fait l'application

- Date automatique chaque jour.
- L'utilisateur entre seulement Radio + Index.
- Si l'index est inférieur au dernier index de la même radio: **Index erroné** et l'entrée n'est pas enregistrée.
- Empêche deux entrées pour la même Date + Radio.
- Les données sont partagées entre tous les téléphones via Google Sheets.
- Admin: voir tous les index, actualiser, modifier, supprimer, exporter Excel.
- PWA installable sur iPhone / Android.

---

# Installation simple

## 1) Créer Google Sheet

1. Ouvrir Google Sheets.
2. Créer un nouveau fichier, par exemple: `Index Compteur Radio`.
3. Aller dans **Extensions > Apps Script**.

## 2) Ajouter le backend Apps Script

1. Supprimer le code vide.
2. Copier tout le contenu du fichier:

```text
apps-script/Code.gs
```

3. Coller dans Apps Script.
4. Dans le code, changer le PIN admin ici:

```js
const ADMIN_PIN = '1234';
```

Exemple:

```js
const ADMIN_PIN = '2580';
```

5. Cliquer **Save**.

## 3) Déployer Apps Script

1. Cliquer **Deploy** > **New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Cliquer **Deploy**.
6. Autoriser le compte Google si demandé.
7. Copier le lien qui finit par:

```text
/exec
```

Exemple:

```text
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec
```

## 4) Coller le lien dans l'application

Tu as 2 méthodes:

### Méthode A — meilleure méthode

Ouvre `config.js` et colle le lien:

```js
window.APP_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbyI35v4eU02Zx-vYNPYYWCVBpDmXhKd_CgW_jXDl2K3H4x7GVLRBlkfhu5Z2vnyuyq13A/exec"
};
```

Ensuite upload les fichiers sur GitHub Pages.

### Méthode B — depuis le téléphone

Si `config.js` reste vide, l'application va afficher Configuration.  
Colle le lien Apps Script dans le téléphone et clique **Enregistrer le lien**.  
Chaque téléphone devra faire cette étape une fois.

## 5) Upload sur GitHub Pages

Upload ces fichiers dans ton repository:

```text
index.html
style.css
script.js
config.js
manifest.json
service-worker.js
assets/icon-192.png
assets/icon-512.png
```

Puis active GitHub Pages:

```text
Settings > Pages > Deploy from branch > main > /root
```

## 6) Installer sur iPhone

1. Ouvrir le lien GitHub Pages dans Safari.
2. Cliquer Share.
3. Cliquer **Add to Home Screen**.

---

# Utilisation

## Utilisateur normal

1. Ouvre l'application.
2. Choisir Radio.
3. Entrer Index.
4. Cliquer **Enregistrer**.

## Admin

1. Ouvre l'application.
2. Entrer PIN admin.
3. Cliquer **Ouvrir admin**.
4. Cliquer **Actualiser** pour voir les index ajoutés par les autres téléphones.
5. L'application actualise aussi automatiquement chaque 10 secondes.
6. Cliquer **Exporter Excel** pour télécharger la fiche.

---

# Important

- Ne donne pas le PIN admin aux utilisateurs simples.
- Si tu modifies le code Apps Script, il faut refaire **Deploy > Manage deployments > Edit > New version > Deploy**.
- Si l'application ne voit pas les nouvelles données, clique **Actualiser**.
