import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const CLE = 'notes';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [courante, setCourante] = useState(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLE).then((v) => {
      if (v) setNotes(JSON.parse(v));
      setCharge(true);
    });
  }, []);

  useEffect(() => {
    if (charge) AsyncStorage.setItem(CLE, JSON.stringify(notes));
  }, [notes, charge]);

  const nouvelle = () => {
    const n = { id: Date.now().toString(), titre: '', texte: '' };
    setNotes([n, ...notes]);
    setCourante(n.id);
  };

  const modifier = (champ, valeur) =>
    setNotes(notes.map((n) => (n.id === courante ? { ...n, [champ]: valeur } : n)));

  const supprimer = () => {
    setNotes(notes.filter((n) => n.id !== courante));
    setCourante(null);
  };

  const note = notes.find((n) => n.id === courante);

  const exporter = async () => {
    try {
      const nom = (note.titre || 'note').replace(/[^a-zA-Z0-9_-]/g, '_') + '.txt';
      const fichier = new File(Paths.cache, nom);
      if (!fichier.exists) fichier.create();
      fichier.write(`${note.titre}\n\n${note.texte}`);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fichier.uri, { mimeType: 'text/plain' });
      }
    } catch (e) {
      alert('Export impossible : ' + e.message);
    }
  };

  const importer = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      const contenu = await (await fetch(asset.uri)).text();
      const n = {
        id: Date.now().toString(),
        titre: asset.name.replace(/\.txt$/i, ''),
        texte: contenu,
      };
      setNotes([n, ...notes]);
    } catch (e) {
      alert('Import impossible : ' + e.message);
    }
  };

  // Écran d'édition
  if (note) {
    return (
      <View style={s.ecran}>
        <View style={s.barre}>
          <TouchableOpacity onPress={() => setCourante(null)}>
            <Text style={s.lien}>← Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exporter}>
            <Text style={s.lien}>Exporter .txt</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={supprimer}>
            <Text style={[s.lien, { color: '#c0392b' }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={s.titre}
          placeholder="Titre"
          value={note.titre}
          onChangeText={(t) => modifier('titre', t)}
        />
        <TextInput
          style={s.texte}
          placeholder="Écris ta note ici..."
          multiline
          value={note.texte}
          onChangeText={(t) => modifier('texte', t)}
        />
      </View>
    );
  }

  // Écran liste
  return (
    <View style={s.ecran}>
      <View style={s.barre}>
        <Text style={s.entete}>Mes notes</Text>
        <TouchableOpacity onPress={importer}>
          <Text style={s.lien}>Importer .txt</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        ListEmptyComponent={<Text style={s.vide}>Aucune note. Appuie sur + pour commencer.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.carte} onPress={() => setCourante(item.id)}>
            <Text style={s.carteTitre}>{item.titre || 'Sans titre'}</Text>
            <Text numberOfLines={1} style={s.carteTexte}>{item.texte}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={s.bouton} onPress={nouvelle}>
        <Text style={s.boutonTexte}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 16 },
  entete: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  vide: { color: '#888', marginTop: 20 },
  carte: { padding: 14, backgroundColor: '#f2f2f2', borderRadius: 10, marginBottom: 8 },
  carteTitre: { fontSize: 16, fontWeight: '600' },
  carteTexte: { color: '#666', marginTop: 2 },
  bouton: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2d7ff9', alignItems: 'center', justifyContent: 'center' },
  boutonTexte: { color: '#fff', fontSize: 30, marginTop: -2 },
  barre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  lien: { fontSize: 16, color: '#2d7ff9' },
  titre: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  texte: { flex: 1, fontSize: 16, textAlignVertical: 'top' },
});