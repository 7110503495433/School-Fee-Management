

import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
// IMPORTANT:
// Laptop browser / Android emulator: http://localhost:5000
// Physical phone: replace localhost with your laptop's Wi-Fi IPv4 address.
// Example: http://192.168.1.5:5000
const API_URL = "http://localhost:5000";
export default function App() {
  const [students, setStudents] = useState([]);

  const [summary, setSummary] = useState({
    totalStudents: 0,
    paidStudents: 0,
    unpaidStudents: 0,
    collectedAmount: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [className, setClassName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  async function loadData(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const [studentResponse, summaryResponse] = await Promise.all([
        fetch(`${API_URL}/api/students`),
        fetch(`${API_URL}/api/summary`)
      ]);
      if (!studentResponse.ok || !summaryResponse.ok) {
        throw new Error("Server returned an error");
      }
      const studentData = await studentResponse.json();
      const summaryData = await summaryResponse.json();
      setStudents(studentData);
      setSummary(summaryData);
    } catch (error) {
      Alert.alert(
        "Connection error",
        "Could not connect to the API. Start the backend and check API_URL."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => {
    loadData();
  }, []);
  async function addStudent() {
    if (!name.trim() || !rollNo.trim() || !className.trim() || !feeAmount.trim()) {
      Alert.alert("Missing information", "Please fill in all four fields.");
      return;
    }
    const amount = Number(feeAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert("Invalid fee", "Enter a valid fee amount.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rollNo: rollNo.trim(),
          className: className.trim(),
          feeAmount: amount
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not add student");
      setName("");
      setRollNo("");
      setClassName("");
      setFeeAmount("");
      Alert.alert("Success", "Student added successfully.");
      loadData(false);
    } catch (error) {
      Alert.alert("Unable to add student", error.message);
    }
  }
  async function updateFee(student, nextStatus) {
    try {
      const response = await fetch(`${API_URL}/api/students/${student.id}/fee`, {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeStatus: nextStatus })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Update failed");
      loadData(false);
    } catch (error) {
      Alert.alert("Update error", error.message);
    }
  }
  function confirmDelete(student) {
    Alert.alert(
      "Delete student",
      `Do you want to delete ${student.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteStudent(student.id) }
      ]
    );
  }
  async function deleteStudent(id) {
    try {
      const response = await fetch(`${API_URL}/api/students/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Delete failed");
      loadData(false);
    } catch (error) {
      Alert.alert("Delete error", error.message);
    }
  }
  const visibleStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase()) ||
        student.className.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || student.feeStatus === filter;
      return matchesSearch && matchesFilter;
    });
  }, [students, search, filter]);
  function renderStudent({ item }) {
    const paid = item.feeStatus === "Paid";
    return (
      <View style={styles.studentCard}>
        <View style={styles.studentTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.muted}>Roll: {item.rollNo}  •  Class: {item.className}</Text>
          </View>
          <Text style={[styles.status, paid ? styles.paid : styles.unpaid]}>
            {item.feeStatus}
          </Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.feeText}>Fee: Rs. {Number(item.feeAmount).toLocaleString()}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.smallButton, paid ? styles.unpaidButton : styles.paidButton]}
              onPress={() => updateFee(item, paid ? "Unpaid" : "Paid")}
            >
              <Text style={styles.smallButtonText}>
                Mark {paid ? "Unpaid" : "Paid"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, styles.deleteButton]}
              onPress={() => confirmDelete(item)}
            >
              <Text style={styles.smallButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#173B70" />
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
       <View style={styles.header}>

          <View style={styles.headerRow}>
            <Image source={require("./assets/profile.jpg")}
            style={styles.logo}
            />
        
          <Text style={styles.headerTitle}>School Fee Management</Text>
          <Text style={styles.headerSubtitle}>Students • Payments • Records</Text>
        </View>
          </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard title="Total Students" value={summary.totalStudents} />
            <StatCard title="Paid Students" value={summary.paidStudents} />
            <StatCard title="Unpaid Students" value={summary.unpaidStudents} />
            <StatCard title="Collected (Rs.)" value={summary.collectedAmount} />
          </View>
          <View style={styles.pendingBox}>
            <Text style={styles.pendingLabel}>Pending Fee Amount</Text>
            <Text style={styles.pendingAmount}>
              Rs. {Number(summary.pendingAmount).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.sectionTitle}>Add New Student</Text>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Student full name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Roll number"
              value={rollNo}
              onChangeText={setRollNo}
            />
            <TextInput
              style={styles.input}
              placeholder="Class / Grade (e.g. BSCS or 8th)"
              value={className}
              onChangeText={setClassName}
            />
            <TextInput
              style={styles.input}
              placeholder="Monthly fee amount"
              value={feeAmount}
              onChangeText={setFeeAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.addButton} onPress={addStudent}>
              <Text style={styles.addButtonText}>+ Add Student</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listHeading}>
            <Text style={styles.sectionTitle}>Student Records</Text>
            <TouchableOpacity onPress={() => loadData(false)}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Search name, roll number or class"
            value={search}
            onChangeText={setSearch}
          />
          <View style={styles.filters}>
            {["All", "Paid", "Unpaid"].map(option => (
              <TouchableOpacity
                key={option}
                onPress={() => setFilter(option)}
                style={[styles.filterButton, filter === option && styles.activeFilter]}
              >
                <Text style={[styles.filterText, filter === option && styles.activeFilterText]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2367B1" style={{ margin: 25 }} />
          ) : (
            <FlatList
              data={visibleStudents}
              keyExtractor={item => item.id}
              renderItem={renderStudent}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No student records found.</Text>
              }
            />
          )}
          <Text style={styles.footer}>School Fee Management App </Text>
          <Text style={styles.footer}>Prepared by Muhammad Raza</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function StatCard({ title, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{Number(value).toLocaleString()}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F6FA" },
 /*header: {
    backgroundColor: "#173B70",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22
  */
  headerRow: {
    backgroundColor: "#173B70",
     paddingHorizontal: 20,
    paddingTop: 20,
   paddingBottom: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logo: {
    width: 55,
    height: 55,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    align:"center",
    textAlign:"center"
  },
  headerTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "bold" },
  headerSubtitle: { color: "#D7E5F8", marginTop: 5, fontSize: 13 },
  content: { padding: 16, paddingBottom: 35 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#18365D", marginTop: 10, marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: {
    width: "48%", backgroundColor: "#ffffff", borderRadius: 12,
    padding: 15, marginBottom: 10, elevation: 2
  },
  statValue: { color: "#1D5E9E", fontSize: 22, fontWeight: "bold" },
  statTitle: { color: "#64748B", fontSize: 12, marginTop: 5 },
  pendingBox: { backgroundColor: "#FFF1D6", borderRadius: 12, padding: 15, marginBottom: 10 },
  pendingLabel: { color: "#81530B", fontSize: 13 },
  pendingAmount: { color: "#81530B", fontWeight: "bold", fontSize: 21, marginTop: 4 },
  form: { backgroundColor: "pink", padding: 14, borderRadius: 12, elevation: 2 },
  input: {
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D9E2EF",
    borderRadius: 9, paddingHorizontal: 13, paddingVertical: 12,
    marginBottom: 10, color: "#1E293B"
  },
  addButton: { backgroundColor: "#2367B1", padding: 14, borderRadius: 9, alignItems: "center" },
  addButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  listHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refreshText: { color: "#2367B1", fontWeight: "bold" },
  filters: { flexDirection: "row", marginBottom: 12, gap: 8 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, backgroundColor: "#E4EAF2" },
  activeFilter: { backgroundColor: "#2367B1" },
  filterText: { color: "#41536B", fontWeight: "600" },
  activeFilterText: { color: "#FFFFFF" },
  studentCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 13, marginBottom: 10, elevation: 2 },
  studentTop: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#DCEBFA", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#1D5E9E", fontWeight: "bold", fontSize: 18 },
  studentInfo: { flex: 1, marginLeft: 10 },
  studentName: { fontSize: 15, color: "#1E293B", fontWeight: "bold" },
  muted: { color: "#718096", fontSize: 11, marginTop: 3 },
  status: { fontSize: 11, fontWeight: "bold", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, overflow: "hidden" },
  paid: { color: "#176B3A", backgroundColor: "#DDF5E6" },
  unpaid: { color: "#9A5A08", backgroundColor: "#FFF0D5" },
  cardBottom: { borderTopWidth: 1, borderTopColor: "#EDF1F6", marginTop: 12, paddingTop: 10 },
  feeText: { color: "#334155", fontWeight: "600", marginBottom: 9 },
  actions: { flexDirection: "row", gap: 8 },
  smallButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 7 },
  paidButton: { backgroundColor: "#197A48" },
  unpaidButton: { backgroundColor: "#B7791F" },
  deleteButton: { backgroundColor: "#C0392B" },
  smallButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#718096", padding: 22 },
  footer: { textAlign: "center", color: "brown", fontSize: 11, marginTop: 22 }
});
