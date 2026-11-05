import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';

import { Image } from 'expo-image';

const PYTHON_API_URL = 'http://192.168.203.50:5000';

export default function GorselAramaScreen({ route }) {
  const imageUrl = route?.params?.imageUrl || '';
  const tip = route?.params?.tip || 'benzer';

  const kategori = route?.params?.kategori || '';
  const anaKategori = route?.params?.anaKategori || '';
  const altKategori = route?.params?.altKategori || '';
  const type = route?.params?.type || '';
  const renk = route?.params?.renk || '';

  const [sonuclar, setSonuclar] = useState([]);
  const [loading, setLoading] = useState(true);

  const ilhamModu = tip === 'ilham';

  useEffect(() => {
    if (imageUrl) {
      veriGetir();
    } else {
      setLoading(false);
    }
  }, [imageUrl, tip, kategori, anaKategori, altKategori, type, renk]);

  const veriGetir = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${PYTHON_API_URL}/api/gorsel-arama`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          tip,
          kategori,
          anaKategori,
          altKategori,
          type,
          renk,
        }),
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setSonuclar(data);
      } else {
        console.log('Görsel arama beklenmeyen cevap:', data);
        setSonuclar([]);
      }
    } catch (err) {
      console.log('API HATA:', err);
      setSonuclar([]);
    } finally {
      setLoading(false);
    }
  };

  const linkAc = async (link) => {
    if (!link) return;

    try {
      const destekliMi = await Linking.canOpenURL(link);

      if (destekliMi) {
        Linking.openURL(link);
      }
    } catch (error) {
      console.log('Link açma hatası:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#8A7BCA" />

        <Text style={styles.loadingText}>
          {ilhamModu
            ? 'Parça + başka parça kombinleri aranıyor...'
            : 'Benzer ürünler aranıyor...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.overline}>
        {ilhamModu ? 'AURA STYLE INSPO' : 'AURA LENS'}
      </Text>

      <Text style={styles.title}>
        {ilhamModu ? 'Nasıl Kombinlerim?' : 'Benzerlerini Gör'}
      </Text>

      <Text style={styles.subtitle}>
        {ilhamModu
          ? `${altKategori || anaKategori || 'Bu parça'} ile başka parçaların kombinlenmiş halleri.`
          : `${altKategori || anaKategori || 'Bu parça'} için benzer ürün ve görsel sonuçları.`}
      </Text>

      {sonuclar.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>

          <Text style={styles.emptyText}>
            {ilhamModu
              ? 'Bu parça için kombin ilhamı bulunamadı. Daha net bir fotoğrafla tekrar dene.'
              : 'Bu parçaya benzer ürün bulunamadı. Fotoğrafı daha net seçerek tekrar dene.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sonuclar}
          numColumns={2}
          keyExtractor={(item, index) => `${item.link || 'sonuc'}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => linkAc(item.link)}
            >
              <Image
                source={{ uri: item.resim }}
                style={styles.image}
                contentFit="cover"
              />

              <View style={styles.cardBody}>
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {item.baslik || 'Sonuç'}
                </Text>

                <View style={styles.platformPill}>
                  <Text style={styles.platform}>
                    {item.platform || 'web'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
    paddingTop: 60,
    paddingHorizontal: 15,
  },

  overline: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 6,
    color: '#F8F7FF',
  },

  subtitle: {
    color: '#B9B4C8',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 18,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070A12',
    paddingHorizontal: 35,
  },

  loadingText: {
    marginTop: 12,
    color: '#C4B5FD',
    fontWeight: '800',
    textAlign: 'center',
  },

  listContent: {
    paddingBottom: 40,
  },

  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    margin: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  image: {
    width: '100%',
    height: 200,
  },

  cardBody: {
    padding: 10,
  },

  cardTitle: {
    color: '#F8F7FF',
    fontWeight: '800',
    fontSize: 12,
    lineHeight: 17,
    minHeight: 34,
  },

  platformPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(167,139,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },

  platform: {
    fontSize: 10,
    color: '#C4B5FD',
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: '#F8F7FF',
    fontSize: 22,
    fontWeight: '900',
  },

  emptyText: {
    color: '#B9B4C8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
});