# Index Compteur Radio - Shared Version FIX

Cette version corrige le problème `Invalid` sur iPhone/GitHub Pages.

## Important
Après avoir uploadé les fichiers sur GitHub, il faut aussi remplacer le code Apps Script par le nouveau fichier:

`apps-script/Code.gs`

Puis faire:
Deploy > Manage deployments > Edit > New version > Deploy

## Admin PIN
PIN par défaut: `1234`

## Fonctionnement
- Date automatique
- Radio depuis liste
- Index chiffres seulement
- Si index inférieur au dernier index de la même radio: `Index erroné`
- Les données sont partagées avec Google Sheets
- Admin peut actualiser, modifier, supprimer, exporter Excel
