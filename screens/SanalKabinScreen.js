import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const VUCUT_TIPLERI = ['İnce', 'Kıvrımlı', 'Atletik'];

export default function SanalKabinScreen() {
  const [vucutTipi, setVucutTipi] = useState('İnce');
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      
      {/* 1. ARKA PLAN: Closetly Aurora Işıkları */}
      <View style={[styles.glowOrb, { top: -50, right: -100, backgroundColor: '#D4C4FF', width: 400, height: 400 }]} />
      <View style={[styles.glowOrb, { bottom: -100, left: -80, backgroundColor: '#FFD1C1', width: 350, height: 350 }]} />

      {/* Üst Bar (Geri Dönüş ve Başlık) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#2D2A26" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Sanal Kabin</Text>
        <View style={{ width: 40 }} /> {/* Başlığı ortalamak için boşluk */}
      </View>

      {/* Vücut Tipi Seçici */}
      <View style={styles.bodyTypeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {VUCUT_TIPLERI.map((tip) => {
            const isActive = vucutTipi === tip;
            return (
              <TouchableOpacity 
                key={tip} 
                onPress={() => setVucutTipi(tip)}
                style={[styles.bodyPill, isActive && styles.bodyPillActive]}
              >
                <Text style={[styles.bodyPillText, isActive && styles.bodyPillTextActive]}>{tip}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Asıl Olay: Avatar Sergileme Alanı */}
      <View style={styles.avatarContainer}>
        <View style={styles.glassShowcase}>
          
          {/* Manken Silüeti */}
          <View style={styles.silhouetteWrapper}>
            {/* İleride buraya kendi tasarladığın manken resimleri gelecek */}
            <Feather name="user" size={250} color="rgba(212, 196, 255, 0.5)" style={{ position: 'absolute' }} />
            
            {/* Tuvalden Gelen Kıyafetlerin Önizlemesi (Örnek Yerleşim) */}
            <View style={styles.clothingPreviewTop}>
              <Feather name="image" size={40} color="#8A7BCA" style={{ opacity: 0.5 }} />
            </View>
            <View style={styles.clothingPreviewBottom}>
              <Feather name="image" size={40} color="#FFD1C1" style={{ opacity: 0.8 }} />
            </View>
          </View>

        </View>
      </View>

      {/* Alt Aksiyon Butonları */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Feather name="edit-2" size={20} color="#8A7BCA" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryBtnText}>Tuvale Dön</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn}>
          <Feather name="check" size={22} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Mükemmel, Kaydet</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EFFF', paddingTop: 60 },
  glowOrb: { position: 'absolute', borderRadius: 300, opacity: 0.6 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20, zIndex: 10 },
  backButton: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#2D2A26' },
  
  bodyTypeContainer: { marginBottom: 20, height: 45 },
  bodyPill: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.5)', marginRight: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', justifyContent: 'center' },
  bodyPillActive: { backgroundColor: '#8A7BCA', borderColor: '#8A7BCA', shadowColor: '#8A7BCA', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  bodyPillText: { color: '#888482', fontWeight: '700', fontSize: 15 },
  bodyPillTextActive: { color: '#FFF', fontWeight: '900' },

  avatarContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  glassShowcase: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.9)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#B0A8B9', shadowOpacity: 0.2, shadowRadius: 25, elevation: 5 },
  
  silhouetteWrapper: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  clothingPreviewTop: { position: 'absolute', top: '25%', width: 140, height: 160, backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#D4C4FF', borderStyle: 'dashed' },
  clothingPreviewBottom: { position: 'absolute', top: '52%', width: 150, height: 180, backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFD1C1', borderStyle: 'dashed' },

  bottomActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 50 },
  secondaryBtn: { flexDirection: 'row', width: '45%', backgroundColor: 'rgba(255, 255, 255, 0.8)', paddingVertical: 18, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFF' },
  secondaryBtnText: { color: '#8A7BCA', fontSize: 15, fontWeight: '800' },
  primaryBtn: { flexDirection: 'row', width: '50%', backgroundColor: '#FFAFAF', paddingVertical: 18, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFAFAF', shadowOpacity: 0.4, shadowRadius: 15, elevation: 5 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});